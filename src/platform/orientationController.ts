export type DisplayOrientation = 'auto' | 'portrait' | 'landscape';
export interface OrientationAdapter { lock(mode: DisplayOrientation): Promise<void>; restore(): Promise<void> }
/** Serialize OS requests so a late lock cannot leave another screen in landscape. */
export class OrientationController {
  private queue: Promise<unknown> = Promise.resolve();
  private generation = 0;
  private active = false;
  constructor(private readonly adapter: OrientationAdapter) {}
  private enqueue<T>(action: () => Promise<T>): Promise<T> {
    const result = this.queue.then(action);
    this.queue = result.catch(() => undefined);
    return result;
  }
  enter(mode: DisplayOrientation) {
    this.active = true;
    const generation = ++this.generation;
    return this.enqueue(async () => { if (this.active && generation === this.generation) await this.adapter.lock(mode); });
  }
  rotate(mode: DisplayOrientation) {
    const generation = this.generation;
    return this.enqueue(async () => {
      if (!this.active || generation !== this.generation) return false;
      await this.adapter.lock(mode);
      return this.active && generation === this.generation;
    });
  }
  leave() {
    this.active = false; ++this.generation;
    return this.enqueue(async () => { if (!this.active) await this.adapter.restore(); });
  }
}
