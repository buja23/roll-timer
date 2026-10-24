package expo.modules.rolltimer

import android.app.NotificationManager
import android.content.Context
import android.media.*
import android.os.*
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import org.json.JSONObject

class AlertAudio(private val context: Context) {
  private val handler = Handler(Looper.getMainLooper())
  private val loadingHandler = Handler(Looper.getMainLooper())
  private val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
  private val notifications = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  private val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
  private val pool = SoundPool.Builder().setMaxStreams(1).setAudioAttributes(attributes).build()
  private val samples = mutableMapOf<String, Int>()
  private val ready = mutableSetOf<Int>()
  private var stream = 0
  private var pending: (() -> Unit)? = null
  private var pendingId = 0
  private var generation = 0L
  private var released = false
  private var speech: TextToSpeech? = null
  private var voiceReady = false
  private var focusRequest: AudioFocusRequest? = null

  init {
    pool.setOnLoadCompleteListener { _, id, status -> loadingHandler.post {
      if (!released && status == 0) {
        ready.add(id)
        if (pendingId == id) { val action = pending; pending = null; pendingId = 0; action?.invoke() }
      } else if (status != 0) Log.w("RollTimerAudio", "Could not preload sample $id")
    } }
    AudioPolicy.durations.keys.forEach { sound -> listOf(sound, "$sound-short").forEach { key ->
      runCatching { context.assets.openFd("roll-timer/$key.wav").use { samples[key] = pool.load(it, 1) } }
        .onFailure { Log.w("RollTimerAudio", "Missing packaged sample $key") }
    } }
  }

  fun initializeVoice() {
    if (speech != null || released) return
    speech = TextToSpeech(context) { status ->
      if (status == TextToSpeech.SUCCESS) {
        val voice = speech?.voices?.firstOrNull { it.locale.language == "pt" && it.locale.country == "BR" && !it.isNetworkConnectionRequired }
        if (voice != null) { speech?.voice = voice; speech?.setAudioAttributes(attributes); voiceReady = true }
      }
    }
    speech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(id: String?) {}
      override fun onDone(id: String?) { handler.post { if (id == "cue-$generation") abandonFocus() } }
      @Deprecated("Android legacy TTS error callback")
      override fun onError(id: String?) { onDone(id) }
    })
  }

  private fun eventSounds(settings: JSONObject): Map<String, String> {
    val configured = settings.optJSONObject("eventSounds")
    val legacy = settings.optString("soundType", "gong").takeIf { AudioPolicy.durations.containsKey(it) } ?: "gong"
    return AudioPolicy.defaults.mapValues { (event, default) ->
      val fallback = if (configured == null && event != "countdown" && event != "restStart") legacy else default
      configured?.optString(event, fallback)?.takeIf { it == "none" || AudioPolicy.durations.containsKey(it) } ?: fallback
    }
  }

  fun play(transition: Boolean, phase: String, settings: JSONObject, nextRound: Boolean = false, previousPhase: String = "") {
    val selected = AudioPolicy.select(eventSounds(settings), previousPhase, phase, transition)
    output(selected, !transition, phase, settings, nextRound, true)
  }

  fun preview(sound: String?, short: Boolean, settings: JSONObject) {
    output(sound?.takeIf { AudioPolicy.durations.containsKey(it) }, short, "fight", settings, false, false)
  }

  private fun permitted(): Boolean = manager.mode == AudioManager.MODE_NORMAL && manager.ringerMode == AudioManager.RINGER_MODE_NORMAL &&
    notifications.currentInterruptionFilter.let { it == NotificationManager.INTERRUPTION_FILTER_ALL || it == NotificationManager.INTERRUPTION_FILTER_UNKNOWN }

  private fun output(sound: String?, short: Boolean, phase: String, settings: JSONObject, nextRound: Boolean, allowVoice: Boolean) {
    if (released) return
    generation++; val token = generation
    handler.removeCallbacksAndMessages(null); pending = null; pendingId = 0
    if (stream != 0) pool.stop(stream); stream = 0; speech?.stop(); vibrator.cancel()
    if (!permitted()) { abandonFocus(); return }
    val gain = AudioPolicy.gain(settings.optString("intensity", "strong"), settings.optDouble("volume", 1.0))
    val voice = allowVoice && !short && settings.optBoolean("voice") && gain > 0
    if (voice) initializeVoice()
    if (allowVoice && settings.optBoolean("vibration")) runCatching { vibrator.vibrate(VibrationEffect.createOneShot(if (short) 50 else 250, VibrationEffect.DEFAULT_AMPLITUDE)) }
    val audible = settings.optBoolean("sound") && sound != null && gain > 0
    if (!audible && !voice) { abandonFocus(); return }
    if (focusRequest == null) {
      val focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attributes)
        .setOnAudioFocusChangeListener({ change -> if (change < 0) stop() }, handler).build()
      if (manager.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) return
      focusRequest = focus
    }
    val complete: () -> Unit = {
      if (generation == token && !released) {
        if (voice && voiceReady && permitted()) {
          val text = when (phase) { "prepare" -> "Preparar!"; "fight" -> if (nextRound) "Próxima rodada! Luta!" else "Luta!"; "rest" -> "Descanso!"; else -> "Treino finalizado!" }
          val params = Bundle().apply { putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, gain) }
          if (speech?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "cue-$token") != TextToSpeech.SUCCESS) abandonFocus()
          handler.postDelayed({ if (generation == token) abandonFocus() }, 5000)
        } else {
          // Keep focus across adjacent countdown ticks, without requesting it
          // again every second. A transition or silence releases it promptly.
          handler.postDelayed({ if (generation == token) abandonFocus() }, if (short) 1100 else 80)
        }
      }
    }
    if (!audible) { complete(); return }
    val key = if (short) "$sound-short" else sound!!
    val id = samples[key]
    if (id == null) { Log.w("RollTimerAudio", "Sample unavailable: $key"); complete(); return }
    val deadline = SystemClock.elapsedRealtime() + if (short) 220 else 700
    val start: () -> Unit = {
      if (generation == token && !released && permitted() && SystemClock.elapsedRealtime() <= deadline) {
        stream = pool.play(id, gain, gain, if (short) 1 else 2, 0, 1f)
        if (stream == 0) Log.w("RollTimerAudio", "Playback denied for $key")
        val duration = if (short) 180L else sound?.let { AudioPolicy.durations[it] } ?: 1350L
        handler.postDelayed({ if (generation == token) { if (stream != 0) pool.stop(stream); stream = 0; complete() } }, duration + 30)
      } else if (generation == token) abandonFocus()
    }
    if (ready.contains(id)) start() else {
      pendingId = id; pending = start
      handler.postDelayed({ if (generation == token && pendingId == id) { pending = null; pendingId = 0; complete() } }, if (short) 230 else 710)
    }
  }
  private fun abandonFocus() { val request = focusRequest; focusRequest = null; request?.let { manager.abandonAudioFocusRequest(it) } }
  fun stop() {
    generation++; handler.removeCallbacksAndMessages(null); pending = null; pendingId = 0
    if (stream != 0) pool.stop(stream); stream = 0; speech?.stop(); vibrator.cancel(); abandonFocus()
  }
  fun release() { if (released) return; stop(); released = true; loadingHandler.removeCallbacksAndMessages(null); pool.release(); speech?.shutdown(); speech = null; ready.clear(); samples.clear() }
}
