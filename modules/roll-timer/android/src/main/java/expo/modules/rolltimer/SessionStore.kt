package expo.modules.rolltimer

import android.content.Context
import android.os.SystemClock
import android.provider.Settings
import org.json.JSONObject

class SessionStore(private val context: Context) {
  private val prefs = context.getSharedPreferences("roll_timer_session", Context.MODE_PRIVATE)
  private fun boot() = Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT, -1)
  fun read(): JSONObject? {
    val raw = prefs.getString("session", null) ?: return null
    return try {
      val s = JSONObject(raw)
      if (s.getInt("boot") != boot() || SystemClock.elapsedRealtime() < s.getLong("anchor")) { clear(); null } else s
    } catch (_: Exception) { clear(); null }
  }
  fun elapsed(s: JSONObject): Long = s.getLong("elapsed") + if (s.getBoolean("paused")) 0 else (SystemClock.elapsedRealtime() - s.getLong("anchor")).coerceAtLeast(0)
  fun write(s: JSONObject) { prefs.edit().putString("session", s.toString()).commit() }
  fun clear() { prefs.edit().remove("session").commit() }
  fun start(payload: String): JSONObject {
    val s = JSONObject(payload).put("elapsed", 0L).put("anchor", SystemClock.elapsedRealtime()).put("paused", false).put("boot", boot())
    write(s); return s
  }
  fun clock(s: JSONObject, elapsed: Long, paused: Boolean) {
    s.put("elapsed", elapsed).put("anchor", SystemClock.elapsedRealtime()).put("paused", paused); write(s)
  }
  fun snapshot(): String? = read()?.let { it.put("currentElapsed", elapsed(it)).toString() }
}
