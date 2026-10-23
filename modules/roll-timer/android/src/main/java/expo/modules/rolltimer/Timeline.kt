package expo.modules.rolltimer

data class Segment(val phase: String, val duration: Long, val round: Int)
data class Frame(val phase: String, val remaining: Long, val end: Long, val round: Int, val cycle: Int, val key: String)
class Timeline(val prepare: Long, val segments: List<Segment>, val period: Long, val total: Long) {
  fun frame(elapsed: Long): Frame {
    val time = elapsed.coerceAtLeast(0)
    if (total >= 0 && time >= total) return Frame("finished", 0, total, 0, 0, "finished")
    if (time < prepare) return Frame("prepare", prepare - time, prepare, 1, 1, "prepare")
    val cycle = (time - prepare) / period
    var start = prepare + cycle * period
    segments.forEachIndexed { index, s ->
      val end = start + s.duration
      if (time < end) return Frame(s.phase, end - time, end, s.round, (cycle + 1).toInt(), "$cycle:$index")
      start = end
    }
    error("Invalid timeline")
  }
}
