export class IndexedArray<T> {
  private list: T[] = [];
  private map = new Map<T, number>();
  constructor(array?: T[]) {
    if (array) {
      for (let i = 0; i < array.length; i++) this.push(array[i]);
    }
  }
  get length() {
    return this.list.length;
  }
  set(index: number, value: T) {
    this.list[index] = value;
  }
  get(index: number) {
    if (index >= this.length) return null;
    return this.list[index];
  }
  indexOf(value: T) {
    return this.map.get(value) ?? -1;
  }
  includes(value: T) {
    return this.map.has(value);
  }
  push(value: T) {
    const length = this.list.push(value);
    this.map.set(value, length - 1);
    return length;
  }
}
