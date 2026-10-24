package expo.modules.rolltimer

import android.content.Intent
import android.content.Context
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicLong

class RollTimerModule : Module() {
  private var preview: AlertAudio? = null
  private val previewHandler = Handler(Looper.getMainLooper())
  private val previewGeneration = AtomicLong(0)
  override fun definition() = ModuleDefinition {
    Name("RollTimer")
    Function("snapshot") { SessionStore(requireNotNull(appContext.reactContext)).snapshot() }
    Function("command") { command: String, payload: String? ->
      val context = requireNotNull(appContext.reactContext)
      val intent = Intent(context, TimerService::class.java).setAction(command)
      if (payload != null) intent.putExtra("payload", payload)
      if (command == "start" || command == "restore") context.startForegroundService(intent) else context.startService(intent)
      Unit
    }
    Function("preview") { settings: String ->
      val context = requireNotNull(appContext.reactContext)
      val current = SessionStore(context).read()
      check(current == null || current.optBoolean("paused")) { "Pause ou encerre o treino antes de testar os sons." }
      val token = previewGeneration.incrementAndGet()
      previewHandler.removeCallbacksAndMessages(null)
      previewHandler.post {
        if (previewGeneration.get() != token) return@post
        if (preview == null) preview = AlertAudio(context)
        preview?.stop()
        val config = JSONObject(settings).put("voice", false).put("vibration", false).put("sound", true)
        if (config.optBoolean("_previewSequence")) {
          val events = config.optJSONObject("eventSounds")
          val cues = AudioPolicy.previewSequence(events?.optString("countdown", "competition") ?: "competition", config.optString("_previewSound", "gong"))
          for (i in 0..5) previewHandler.postDelayed({ if (previewGeneration.get() == token) runCatching { preview?.preview(cues[i], i < 5, config) } }, i * 1000L)
        } else runCatching { preview?.preview(config.optString("_previewSound", "gong"), false, config) }
      }
    }
    Function("audioStatus") {
      val context = requireNotNull(appContext.reactContext)
      val manager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val value = manager.getStreamVolume(AudioManager.STREAM_MUSIC)
      val max = manager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
      JSONObject().put("mediaVolume", value).put("mediaMax", max).put("lowVolume", max > 0 && value.toDouble() / max < .3).put("silent", manager.ringerMode != AudioManager.RINGER_MODE_NORMAL).toString()
    }
    Function("stopPreview") { previewGeneration.incrementAndGet(); previewHandler.removeCallbacksAndMessages(null); previewHandler.post { preview?.stop() } }
    OnDestroy { previewGeneration.incrementAndGet(); previewHandler.removeCallbacksAndMessages(null); previewHandler.post { preview?.release(); preview = null } }
  }
}
