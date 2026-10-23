package expo.modules.rolltimer

// Keys survive process recreation. The caller stores them before attempting audio.
class CueGate(var lastCue: String = "", var phase: String = "") {
  fun next(frame: Frame, paused: Boolean, countdown: Boolean): String? {
    if (paused) return null
    val second = (frame.remaining + 999) / 1000
    val key = "${frame.key}:$second"
    if (lastCue == key) return null
    val transition = phase != frame.key
    lastCue = key; phase = frame.key
    return if (transition) "transition" else if (countdown && second in 1L..5L) "tick" else null
  }
}
