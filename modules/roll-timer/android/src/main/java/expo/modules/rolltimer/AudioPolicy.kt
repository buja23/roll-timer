package expo.modules.rolltimer

// Presentation of alerts only; no clock, rounds or timeline state lives here.
object AudioPolicy {
  val durations = mapOf("beep" to 240L, "competition" to 240L, "gong" to 1350L, "bell" to 1200L, "horn" to 850L, "whistle" to 700L, "alarm" to 900L)
  val defaults = mapOf("countdown" to "competition", "fightStart" to "gong", "fightEnd" to "bell", "restStart" to "none", "restEnd" to "gong", "workoutEnd" to "gong")
  fun events(previous: String, phase: String): List<String> = when {
    phase == "finished" -> listOf("workoutEnd")
    phase == "prepare" -> emptyList()
    previous == "fight" && phase == "rest" -> listOf("fightEnd", "restStart")
    previous == "rest" && phase == "fight" -> listOf("restEnd", "fightStart")
    previous == "fight" && phase == "fight" -> listOf("fightEnd", "fightStart")
    phase == "fight" -> listOf("fightStart")
    phase == "rest" -> listOf("restStart")
    else -> emptyList()
  }
  fun select(events: Map<String, String>, previous: String, phase: String, transition: Boolean): String? {
    val keys = if (transition) AudioPolicy.events(previous, phase) else listOf("countdown")
    return keys.mapNotNull { events[it] }.firstOrNull { durations.containsKey(it) }
  }
  fun gain(intensity: String, volume: Double): Float {
    val factor = when (intensity) { "normal" -> .55; "maximum" -> 1.0; else -> .85 }
    return (factor * (if (volume.isFinite()) volume else 1.0).coerceIn(0.0, 1.0)).toFloat()
  }
  fun previewSequence(countdown: String, ending: String = "gong"): List<String> {
    val tick = countdown.takeIf { durations.containsKey(it) } ?: "competition"
    val gong = ending.takeIf { durations.containsKey(it) } ?: "gong"
    return List(5) { tick } + gong
  }
}
