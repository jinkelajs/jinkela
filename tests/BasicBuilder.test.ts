import { BasicBuilder } from '../src/BasicBuilder';

const r =
  <T extends typeof BasicBuilder>(Builder: T) =>
  ({ raw }: any, ...vars: any[]) =>
    new Builder(raw, vars) as InstanceType<T>;

test('Empty', () => {
  r(
    class extends BasicBuilder {
      __test() {
        expect(this.done).toBe(true);
      }
    },
  )``.__test();
});

test('Only 1 Variable', () => {
  r(
    class extends BasicBuilder {
      __test() {
        expect(this.done).toBe(false);
        expect(this.read()).toBeUndefined();
        expect(this.getVariable()).toBe(123);
        expect(this.done).toBe(true);
      }
    },
  )`${123}`.__test();
});

test('.look() and .read()', () => {
  r(
    class extends BasicBuilder {
      __test() {
        expect(this.look()).toBe('<');
        expect(this.look(6)).toBe('<span>');
        expect(this.read(6)).toBe('<span>');
        expect(this.look(7)).toBe('</span>');
        expect(this.read(7)).toBe('</span>');
        expect(this.done).toBe(true);
      }
    },
  )`<span></span>`.__test();
});

test('.look() and .read() with Variables', () => {
  r(
    class extends BasicBuilder {
      __test() {
        expect(this.read(6)).toBe('<span>');
        expect(this.look()).toBe(undefined);
        expect(this.read()).toBe(undefined);
        expect(this.getVariable()).toBe(1);
        expect(this.look()).toBe('-');
        expect(this.read()).toBe('-');
        expect(this.look(100)).toBe(undefined);
        expect(this.read(100)).toBe(undefined);
        expect(this.look()).toBe('-');
        expect(this.read()).toBe('-');
        expect(this.look(1)).toBe(undefined);
        expect(this.read(1)).toBe(undefined);
        expect(this.read(7)).toBe('</span>');
        expect(this.done).toBe(true);
      }
    },
  )`<span>${1}-${2}-${3}</span>`.__test();
});

test('.look() and .read() with Boundary Variables', () => {
  r(
    class extends BasicBuilder {
      __test() {
        expect(this.done).toBe(false);
        expect(this.look()).toBe(undefined);
        expect(this.read()).toBe(undefined);
        expect(this.getVariable()).toBe(1);
        expect(this.read(6)).toBe('<span>');
        expect(this.look()).toBe(undefined);
        expect(this.read()).toBe(undefined);
        expect(this.getVariable()).toBe(2);
        expect(this.read()).toBe('a');
        expect(this.look()).toBe(undefined);
        expect(this.read()).toBe(undefined);
        expect(this.done).toBe(false);
        expect(this.getVariable()).toBe(3);
        expect(this.read(7)).toBe('</span>');
        expect(this.look()).toBe(undefined);
        expect(this.done).toBe(false);
        expect(this.read()).toBe(undefined);
        expect(this.done).toBe(true);
      }
    },
  )`${1}<span>${2}a${3}</span>${4}`.__test();
});

test('.look() EOF', () => {
  r(
    class extends BasicBuilder {
      __test() {
        this.read(3);
        expect(() => {
          this.look();
        }).toThrowError('EOF');
      }
    },
  )`abc`.__test();
});

test('Bad Index', () => {
  r(
    class extends BasicBuilder {
      __test() {
        this.index = 100;
        expect(this.done).toBeTruthy();
      }
    },
  )`abc`.__test();
});
