import { SlotVar } from './HtmlBuilder';

export class BasicBuilder {
  protected index = 0;
  protected position = 0;

  protected reset() {
    this.index = 0;
    this.position = 0;
  }

  /**
   * Read head chars, may be undefined in gap of template fragmetns.
   */
  protected read(length = 1) {
    const c = this.look(length);
    this.position += length;
    return c;
  }

  /**
   * Get head chars, may be undefined in gap of template fragmetns.
   */
  protected look(length = 1) {
    if (this.done) throw new Error('EOF');
    const { frags } = this;
    // CASE 1: Read char from frag, if position > length of current frag.
    // CASE 2: Read from variables by index, if position === length of current frag.
    // CASE 3: Move to next index, if position > length of current frag.
    if (this.index < frags.length && this.position > frags[this.index].length) {
      this.index++;
      this.position = 0;
    }
    return this.frags[this.index].slice(this.position, this.position + length) || undefined;
  }

  get done() {
    const { frags } = this;
    let { index, position } = this;
    for (;;) {
      // Is't done, if index out of frags range.
      if (index >= frags.length) return true;
      // Try to read variable, but index has been the last frag, no any variable can be read.
      if (position === frags[index].length && index === frags.length - 1) return true;
      // It's not done, char or variable can be read.
      if (position <= frags[index].length) return false;
      // Position has fulled, reset position and move to next index.
      index++;
      position = 0;
    }
  }

  protected getVariable() {
    return this.vars[this.index];
  }

  protected readWhile(pattern: RegExp | string, readVariable = false) {
    let sb = '';
    for (;;) {
      if (this.done) return sb;
      const c = this.look();
      if (c) {
        if (typeof pattern === 'string') {
          if (pattern.indexOf(c) === -1) return sb;
        } else {
          if (!pattern.test(c)) return sb;
        }
        this.read();
        sb += c;
      } else {
        if (!readVariable) return sb;
        this.read();
        sb += this.getVariable();
      }
    }
  }

  protected readUntil(pattern: string, readVariable = false) {
    let sb = '';
    for (;;) {
      if (this.done) return sb;
      const c = this.look();
      if (c) {
        if (pattern.indexOf(c) !== -1) return sb;
        this.read();
        sb += c;
      } else {
        if (!readVariable) return sb;
        this.read();
        sb += this.getVariable();
      }
    }
  }

  constructor(protected frags: string[] | ArrayLike<string>, protected vars: SlotVar[]) {}
}
