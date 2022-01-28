import { assertDefined, isValueType, uDiff, vl2s } from './utils';
import { live, touch } from './StateManager';

interface IPair {
  readonly type: 'pair';
  name: any[];
  value: any[];
}

interface ISpread {
  readonly type: 'spread';
  value: any;
}

type IAttrs = Record<string, string | null | any[]>;
type IEvents = Record<string, ((...a: any[]) => void)[]>;

export class AttributesManager {
  private list = [] as (IPair | ISpread)[];
  private attrs: IAttrs = {};
  private events: IEvents = {};
  private cancelMap = new WeakMap<Attr, () => void>();
  private element?: HTMLElement;

  private restructure() {
    const attrs = {} as IAttrs;
    const events = {} as IEvents;
    const { list } = this;
    // Classify list items into attributes or events.
    // Left value will be override by right with same name.
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (item.type === 'pair') {
        const { name, value } = item;
        const sName = vl2s(name);
        if (sName[0] == '@') {
          // Convert to a function array (remove all non-function items).
          events[sName.slice(1)] = value.filter((i) => typeof i === 'function');
        } else {
          if (sName) attrs[sName] = value;
        }
      }
      // It's a spread type
      else {
        const { value } = item;
        const res = typeof value === 'function' ? value() : value;
        if (isValueType(res)) {
          attrs[String(res)] = '';
        } else {
          const dict = Object(res);
          touch(dict);
          const keys = Object.keys(dict);
          for (let j = 0; j < keys.length; j++) {
            const name = keys[j];
            if (name[0] == '@') {
              // Convert to a function array (remove all non-function items).
              events[name.slice(1)] = [].concat(dict[name]).filter((i) => typeof i === 'function');
            } else if (dict[name] === null || dict[name] === undefined) {
              attrs[name] = null;
            } else {
              attrs[name] = String(dict[name]);
            }
          }
        }
      }
    }
    return { attrs, events };
  }

  private updateEvents(events: IEvents) {
    const { element, events: prev } = this;
    assertDefined(element);
    uDiff(Object.keys(prev), Object.keys(events), {
      // New event, add all.
      add(name) {
        for (let i = 0; i < events[name].length; i++) {
          element.addEventListener(name, events[name][i]);
        }
      },
      // Remove event, remove all listeners.
      delete(name) {
        for (let i = 0; i < prev[name].length; i++) {
          element.removeEventListener(name, prev[name][i]);
        }
      },
      // Update event listener list.
      modify(name) {
        uDiff(prev[name], events[name], {
          add: (func) => element.addEventListener(name, func),
          delete: (func) => element.removeEventListener(name, func),
          modify() {
            // Event handler has set, nothing to do.
          },
        });
      },
    });
    this.events = events;
  }

  private setBindingAttr(name: string, fn: () => string) {
    const { element, cancelMap } = this;
    assertDefined(element);
    const oan = element.attributes.getNamedItem(name);
    // Has old attribute node, update it.
    if (oan) {
      cancelMap.get(oan)?.();
      const cancel = live(fn, (v) => (oan.value = String(v)));
      cancelMap.set(oan, cancel);
    }
    // Has no attribute node, create new one.
    else {
      const an = document.createAttribute(name);
      const cancel = live(fn, (v) => (an.value = String(v)));
      cancelMap.set(an, cancel);
      element.setAttributeNode(an);
    }
  }

  private unsetBindingAttr(name: string) {
    const { element, cancelMap } = this;
    assertDefined(element);
    const an = element.attributes.getNamedItem(name);
    if (!an) return;
    element.removeAttributeNode(an);
    const cancel = cancelMap.get(an);
    assertDefined(cancel);
    cancel();
    cancelMap.delete(an);
  }

  private updateAttrs(attrs: IAttrs) {
    const { element, attrs: prev } = this;
    assertDefined(element);
    const update = (name: string) => {
      const value = attrs[name];
      if (value instanceof Array) {
        this.setBindingAttr(name, () => vl2s(value));
      } else if (value === null) {
        this.unsetBindingAttr(name);
      } else {
        this.setBindingAttr(name, () => value);
      }
    };
    uDiff(Object.keys(prev), Object.keys(attrs), {
      add: update,
      delete: (name) => this.unsetBindingAttr(name),
      modify: update,
    });
    this.attrs = attrs;
  }

  addPair(name: any[], value: any[]) {
    this.list.push({ type: 'pair', name, value });
  }

  addSpread(value: any) {
    this.list.push({ type: 'spread', value });
  }

  bind(element: HTMLElement) {
    this.element = element;
    // Watch attributes list structure change (spread attributes may add or remove some attributes),
    // and update events and attributes.
    live(
      () => this.restructure(),
      ({ attrs, events }) => {
        this.updateEvents(events);
        this.updateAttrs(attrs);
      },
    );
  }
}
