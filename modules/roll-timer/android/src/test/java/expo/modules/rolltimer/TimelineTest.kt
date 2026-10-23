package expo.modules.rolltimer

import org.junit.Assert.*
import org.junit.Test

class TimelineTest {
  private val segments = listOf(Segment("fight", 10000, 1), Segment("rest", 3000, 1), Segment("fight", 10000, 2), Segment("rest", 3000, 2))
  private val timeline = Timeline(2000, segments, 26000, 25000)
  @Test fun boundariesAndFinalRound() {
    assertEquals("prepare", timeline.frame(1999).phase)
    assertEquals("fight", timeline.frame(2000).phase)
    assertEquals("rest", timeline.frame(12000).phase)
    assertEquals(2, timeline.frame(15000).round)
    assertEquals("finished", timeline.frame(25000).phase)
  }
  @Test fun delayAndInfinite() {
    assertEquals(8457L, timeline.frame(16543).remaining)
    val infinite = Timeline(2000, segments, 26000, -1)
    assertEquals(2, infinite.frame(28000).cycle)
    assertEquals("fight", infinite.frame(28000).phase)
    assertNotEquals("finished", infinite.frame(100000000000L).phase)
  }
  @Test fun cycleRestReplacesNormalRest() {
    val cycle = Timeline(2000, segments.dropLast(1) + Segment("rest", 7000, 2), 30000, 55000)
    assertEquals(7000L, cycle.frame(25000).remaining)
    assertEquals(2, cycle.frame(32000).cycle)
    assertEquals("finished", cycle.frame(55000).phase)
  }
  @Test fun alertDedupePauseAndRestore() {
    val gate = CueGate()
    assertNull(gate.next(timeline.frame(0), true, true))
    assertEquals("transition", gate.next(timeline.frame(0), false, true))
    assertNull(gate.next(timeline.frame(50), false, true))
    assertEquals("tick", gate.next(timeline.frame(1000), false, true))
    val restored = CueGate(gate.lastCue, gate.phase)
    assertNull(restored.next(timeline.frame(1100), false, true))
    assertEquals("transition", restored.next(timeline.frame(18000), false, true))
    assertNull(restored.next(timeline.frame(18001), false, true))
  }
  @Test fun failedAudioIsNotRetriedForSameCue() {
    val gate = CueGate()
    if (gate.next(timeline.frame(0), false, true) != null) runCatching { error("Audio unavailable") }
    assertNull(gate.next(timeline.frame(0), false, true))
    assertEquals("fight", timeline.frame(2000).phase)
  }
}
