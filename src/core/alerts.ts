import { Frame } from './timer';
// Late ticks emit only the current cue. No replay of missed seconds/transitions.
export class AlertGate {
  private last = '';
  private phase = '';
  reset() { this.last = ''; this.phase = ''; }
  next(frame: Frame, paused: boolean, countdown: boolean): 'transition' | 'tick' | null {
    if (paused) return null;
    const second = Math.ceil(frame.remaining / 1000);
    const key = `${frame.key}:${second}`;
    if (key === this.last) return null;
    const transition = this.phase !== frame.key;
    this.last = key;
    this.phase = frame.key;
    if (transition) return 'transition';
    return countdown && second >= 1 && second <= 5 ? 'tick' : null;
  }
}
