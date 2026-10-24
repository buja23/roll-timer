package expo.modules.rolltimer

import android.app.*
import android.content.*
import android.os.*
import org.json.JSONObject
import kotlin.math.ceil

class TimerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var store: SessionStore
  private lateinit var audio: AlertAudio
  private var session: JSONObject? = null
  private var timeline: Timeline? = null
  private var lastKey = ""
  private var lock: PowerManager.WakeLock? = null
  private var renewLockAt = 0L
  private var foreground = false
  private val ticker = object : Runnable {
    override fun run() { tick(); if (foreground) handler.postDelayed(this, 100) }
  }
  override fun onCreate() {
    super.onCreate(); store = SessionStore(this); audio = AlertAudio(this)
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel("training", "Treino em andamento", NotificationManager.IMPORTANCE_LOW).apply { setSound(null, null) })
  }
  override fun onBind(intent: Intent?) = null
  private fun plan(s: JSONObject): Timeline {
    val p = s.getJSONObject("plan"); val list = p.getJSONArray("segments")
    return Timeline(p.getLong("prepare"), (0 until list.length()).map { i -> val x = list.getJSONObject(i); Segment(x.getString("phase"), x.getLong("duration"), x.getInt("round")) }, p.getLong("period"), p.getLong("total"))
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    handler.removeCallbacksAndMessages(null)
    val action = intent?.action ?: "restore"
    if (action == "stop") { store.clear(); finishService(); return START_NOT_STICKY }
    session = if (action == "start") store.start(requireNotNull(intent?.getStringExtra("payload"))) else store.read()
    val s = session ?: run { finishService(); return START_NOT_STICKY }
    timeline = plan(s)
    if (action == "start") { lastKey = ""; audio.stop() }
    when (action) {
      "pause", "toggle" -> { store.clock(s, store.elapsed(s), if (action == "toggle") !s.getBoolean("paused") else true); audio.stop() }
      "resume" -> store.clock(s, store.elapsed(s), false)
      "restart" -> { s.remove("lastCue"); s.remove("alertPhase"); s.remove("audioPhase"); store.clock(s, 0, false); lastKey = ""; audio.stop() }
      "skip" -> { store.clock(s, timeline!!.frame(store.elapsed(s)).end, s.getBoolean("paused")); audio.stop() }
    }
    if (s.getJSONObject("settings").optBoolean("voice")) audio.initializeVoice()
    startForeground(41, notification("Roll Timer", "Preparando treino", s.getBoolean("paused"))); foreground = true
    updateLock(!s.getBoolean("paused"))
    handler.removeCallbacks(ticker); ticker.run()
    return START_STICKY
  }
  private fun tick() {
    val s = session ?: return; val t = timeline ?: return
    val elapsed = store.elapsed(s); val f = t.frame(elapsed); val paused = s.getBoolean("paused")
    val second = ceil(f.remaining / 1000.0).toInt(); val cueKey = "${f.key}:$second"; val key = "$cueKey:$paused"
    if (key != lastKey) {
      val settings = s.getJSONObject("settings")
      val gate = CueGate(s.optString("lastCue"), s.optString("alertPhase"))
      val cue = gate.next(f, paused, settings.optBoolean("countdown"))
      val previousPhase = s.optString("audioPhase")
      s.put("audioPhase", f.phase)
      s.put("alertPhase", gate.phase).put("lastCue", gate.lastCue)
      if (cue != null) {
        store.write(s)
        runCatching { audio.play(cue == "transition", f.phase, settings, f.phase == "fight" && (f.round > 1 || f.cycle > 1), previousPhase) }
      }
      lastKey = key
      val label = when (f.phase) { "prepare" -> "PREPARAR"; "fight" -> "LUTA"; "rest" -> "DESCANSO"; else -> "TREINO FINALIZADO" }
      getSystemService(NotificationManager::class.java).notify(41, notification(if (paused) "PAUSADO · $label" else label, "%02d:%02d · Rodada %d · Ciclo %d".format(second / 60, second % 60, f.round, f.cycle), paused))
    }
    updateLock(!paused && f.phase != "finished")
    if (f.phase == "finished") {
      store.clock(s, t.total, true)
      // Allow the final gong/voice to finish, then release every resource.
      foreground = false; updateLock(false); handler.removeCallbacks(ticker)
      handler.postDelayed({ finishService() }, 3500)
    }
  }
  private fun notification(title: String, text: String, paused: Boolean): Notification {
    val open = packageManager.getLaunchIntentForPackage(packageName)
    val builder = Notification.Builder(this, "training").setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title).setContentText(text).setOnlyAlertOnce(true).setOngoing(true)
    if (open != null) builder.setContentIntent(PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
    listOf("toggle" to if (paused) "Continuar" else "Pausar", "stop" to "Encerrar").forEachIndexed { index, pair ->
      val pending = PendingIntent.getService(this, index + 1, Intent(this, TimerService::class.java).setAction(pair.first), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      builder.addAction(Notification.Action.Builder(null, pair.second, pending).build())
    }
    return builder.build()
  }
  private fun updateLock(active: Boolean) {
    if (active && (lock?.isHeld != true || SystemClock.elapsedRealtime() >= renewLockAt)) {
      if (lock?.isHeld == true) lock?.release()
      lock = (getSystemService(POWER_SERVICE) as PowerManager).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RollTimer:Workout").apply { acquire(10 * 60 * 1000L) }
      renewLockAt = SystemClock.elapsedRealtime() + 5 * 60 * 1000L
    }
    if (!active) { if (lock?.isHeld == true) lock?.release(); lock = null }
  }
  private fun finishService() { foreground = false; handler.removeCallbacksAndMessages(null); audio.stop(); updateLock(false); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf() }
  override fun onDestroy() { handler.removeCallbacksAndMessages(null); audio.release(); updateLock(false); super.onDestroy() }
}
