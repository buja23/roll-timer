package expo.modules.rolltimer

import org.junit.Assert.*
import org.junit.Test

class AudioPolicyTest {
  @Test fun transitionsHaveOnePrioritizedEffect() {
    val sounds = AudioPolicy.defaults
    assertEquals("gong", AudioPolicy.select(sounds, "prepare", "fight", true))
    assertEquals("bell", AudioPolicy.select(sounds, "fight", "rest", true))
    assertEquals("gong", AudioPolicy.select(sounds, "rest", "fight", true))
    assertEquals("gong", AudioPolicy.select(sounds, "fight", "finished", true))
    assertNull(AudioPolicy.select(sounds, "", "prepare", true))
    assertEquals("competition", AudioPolicy.select(sounds, "fight", "fight", false))
  }
  @Test fun optionalEventsFallbackWithoutOverlapping() {
    val sounds = AudioPolicy.defaults + mapOf("fightEnd" to "none", "restStart" to "horn")
    assertEquals("horn", AudioPolicy.select(sounds, "fight", "rest", true))
    assertNull(AudioPolicy.select(sounds + ("countdown" to "none"), "fight", "fight", false))
  }
  @Test fun profilesNeverAmplifyBeyondTheMediaStream() {
    assertEquals(.55f, AudioPolicy.gain("normal", 1.0), .001f)
    assertEquals(.85f, AudioPolicy.gain("strong", 1.0), .001f)
    assertEquals(1f, AudioPolicy.gain("maximum", 50.0), .001f)
    assertEquals(0f, AudioPolicy.gain("maximum", -1.0), .001f)
    assertEquals(.425f, AudioPolicy.gain("strong", .5), .001f)
  }
  @Test fun demonstrationAlwaysHasFiveTicksAndTheRequestedGong() {
    assertEquals(List(5) { "competition" } + "gong", AudioPolicy.previewSequence("none"))
    assertEquals(List(5) { "whistle" } + "gong", AudioPolicy.previewSequence("whistle"))
  }
}
