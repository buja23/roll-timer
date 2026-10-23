package expo.modules.rolltimer

import android.content.Context
import android.media.*
import android.os.*
import android.speech.tts.TextToSpeech
import org.json.JSONObject
import java.util.Locale

class AlertAudio(private val context: Context) {
  private val handler = Handler(Looper.getMainLooper())
  private var player: MediaPlayer? = null
  private var speech: TextToSpeech? = null
  private var voiceReady = false
  private var focusRequest: AudioFocusRequest? = null
  private val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
  private val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
  fun initializeVoice() {
    if (speech != null) return
    speech = TextToSpeech(context) { status ->
      if (status == TextToSpeech.SUCCESS) {
        val voice = speech?.voices?.firstOrNull { it.locale.language == "pt" && it.locale.country == "BR" && !it.isNetworkConnectionRequired }
        if (voice != null) { speech?.voice = voice; voiceReady = true }
      }
    }
  }
  fun play(transition: Boolean, phase: String, settings: JSONObject, nextRound: Boolean = false) {
    stop()
    if (manager.mode != AudioManager.MODE_NORMAL) return
    if (settings.optBoolean("voice")) initializeVoice()
    if (settings.optBoolean("vibration")) runCatching { vibrator.vibrate(VibrationEffect.createOneShot(if (transition) 250 else 50, VibrationEffect.DEFAULT_AMPLITUDE)) }
    val focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(attributes).setOnAudioFocusChangeListener { change -> if (change < 0) stop() }.build()
    focusRequest = focus
    if (manager.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) return
    val speak: () -> Unit = {
      if (transition && settings.optBoolean("voice") && voiceReady) {
        val text = when (phase) { "prepare" -> "Preparar!"; "fight" -> if (nextRound) "Próxima rodada! Luta!" else "Luta!"; "rest" -> "Descanso!"; else -> "Treino finalizado!" }
        val params = Bundle().apply { putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, settings.optDouble("volume", 0.8).toFloat().coerceIn(0f, 1f)) }
        speech?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "phase")
      }
    }
    if (settings.optBoolean("sound")) {
      try {
        val asset = if (transition) settings.optString("soundType", "gong") else "tick"
        val p = MediaPlayer(); player = p
        p.setAudioAttributes(attributes)
        context.assets.openFd("roll-timer/$asset.wav").use { p.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
        val volume = settings.optDouble("volume", 0.8).toFloat().coerceIn(0f, 1f); p.setVolume(volume, volume)
        p.setOnCompletionListener { if (player === it) { player = null; it.release(); speak() } }
        p.setOnErrorListener { mp, _, _ -> if (player === mp) player = null; mp.release(); true }
        p.prepare(); p.start()
      } catch (_: Exception) { player?.release(); player = null; speak() }
    } else speak()
    handler.postDelayed({ focusRequest?.let { manager.abandonAudioFocusRequest(it) }; focusRequest = null }, 3000)
  }
  fun stop() {
    handler.removeCallbacksAndMessages(null)
    player?.let { runCatching { it.stop() }; it.release() }; player = null
    speech?.stop(); vibrator.cancel()
    focusRequest?.let { manager.abandonAudioFocusRequest(it) }; focusRequest = null
  }
  fun release() { stop(); speech?.shutdown(); speech = null }
}
