import { live } from './StateManager';

export class LiveStringBuilder {
  private list: any[] = [];
  private listener: ((s: string) => void)[] = [];
  private value?: string;
  private cache = new Map<() => any, string>();
  constructor(initList?: any[]) {
    if (initList) {
      for (let i = 0; i < initList.length; i++) {
        this.append(initList[i]);
      }
    }
  }
  private updateValueIfNeeded() {
    if (this.value === undefined) return;
    this.value = undefined;
    this.getValue();
  }
  /**
   * Append string or function.
   */
  append(item: any) {
    this.list.push(item);
    if (typeof item === 'function') {
      live(item, (v) => {
        this.cache.set(item, v);
        this.updateValueIfNeeded();
      });
    } else {
      this.updateValueIfNeeded();
    }
  }
  /**
   * Get and watch value.
   * NOTE: Handler function will be called in next value change event.
   */
  watch(handler: (s: string) => void) {
    if (this.value === undefined) this.getValue();
    this.listener.push(handler);
  }
  /**
   * Get and watch value.
   * NOTE: Handler function will be called immediately.
   */
  live(handler: (s: string) => void) {
    handler(this.getValue());
    this.listener.push(handler);
  }

  /**
   * Get current value.
   */
  getValue(): string {
    if (typeof this.value === 'string') return this.value;
    const text = this.list
      .map((i) => {
        if (typeof i !== 'function') return i;
        return this.cache.get(i);
      })
      .join('');
    this.value = text;
    const { listener } = this;
    for (let i = 0; i < listener.length; i++) listener[i](text);
    return text;
  }
}
