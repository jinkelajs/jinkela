export class StringBuilder {
  private str = '';
  constructor(private action?: (s: string) => void) {}
  commit() {
    if (!this.str) return;
    const { str } = this;
    this.action?.(str);
    this.str = '';
    return str;
  }
  append(part: string) {
    this.str += part;
  }
  valueOf() {
    return this.str;
  }
}
