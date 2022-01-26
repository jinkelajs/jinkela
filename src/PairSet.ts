export class PairSet<A, B> {
  private storage = new Map<A, Set<B>>();
  add(a: A, b: B) {
    const s = this.storage.get(a);
    if (s) {
      s.add(b);
    } else {
      this.storage.set(a, new Set([b]));
    }
  }
  delete(a: A, b: B) {
    const s = this.storage.get(a);
    if (s) return s.delete(b);
    return false;
  }
  forEach(cb: (a: A, b: B) => void) {
    this.storage.forEach((s, a) => {
      s.forEach((b) => cb(a, b));
    });
  }
  clear() {
    this.storage.forEach((s) => s.clear());
    this.storage.clear();
  }
}
