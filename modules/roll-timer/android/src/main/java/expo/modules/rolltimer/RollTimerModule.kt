package expo.modules.rolltimer

import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject

class RollTimerModule : Module() {
  private var preview: AlertAudio? = null
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
      android.os.Handler(android.os.Looper.getMainLooper()).post {
        if (preview == null) preview = AlertAudio(context)
        runCatching { preview?.play(true, "fight", JSONObject(settings)) }
      }
    }
    Function("stopPreview") { android.os.Handler(android.os.Looper.getMainLooper()).post { preview?.stop() } }
    OnDestroy { preview?.release(); preview = null }
  }
}
