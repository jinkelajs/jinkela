import { PairSet } from './PairSet';
import { assertDefined } from './utils';

const handlerMap = new WeakMap<() => void, PairSet<EventTarget, string>>();

type Recording = undefined | PairSet<EventTarget, string>;
let recording: Recording = undefined;
const recordingStack: Recording[] = [recording];

type Fn = () => void;
const debounceCache = new WeakMap<Fn, Fn>();
const debounceWaitingSet = new Set<Fn>();
const debounce = (fn: () => void) => {
  let dfn = debounceCache.get(fn);
  if (dfn) return dfn;
  dfn = () => {
    if (debounceWaitingSet.has(fn)) return;
    debounceWaitingSet.add(fn);
    // Next tick.
    Promise.resolve().then(() => {
      if (!debounceWaitingSet.has(fn)) return;
      debounceWaitingSet.delete(fn);
      fn();
    });
  };
  debounceCache.set(fn, dfn);
  return dfn;
};

export const digestImmediately = () => {
  debounceWaitingSet.forEach((fn) => {
    debounceWaitingSet.delete(fn);
    fn();
  });
};

/**
 * Get and watch value.
 * NOTE: Handler function will be called immediately.
 */
export const live = <T extends Fn>(fn: T, handler: (value: ReturnType<T>) => void) => {
  // Execute function with `executeAndRecordDeps`.
  // `update` will be called while any dependencies change.
  const update = () => {
    // The return value of function will be passed to handler.
    handler(executeAndRecordDeps(fn, update));
  };
  update();
};

const executeAndRecordDeps = <T extends (...args: any[]) => any>(fn: T, onUpdate: Fn): ReturnType<T> => {
  try {
    recordingStack.push(recording);
    recording = new PairSet<EventTarget, string>();
    return fn();
  } finally {
    assertDefined(recording);
    const debouncedOnUpdate = debounce(onUpdate);
    const old = handlerMap.get(onUpdate);
    recording.forEach((et, name) => {
      if (old?.delete(et, name)) return;
      et.addEventListener(name, debouncedOnUpdate);
    });
    old?.forEach((et, name) => {
      et.removeEventListener(name, debouncedOnUpdate);
    });
    handlerMap.set(onUpdate, recording);
    recording = recordingStack.pop() as Recording;
  }
};

export const createState = <T extends Record<PropertyKey, any>>(value: T) => {
  const isArray = value instanceof Array;
  const et = new EventTarget();
  const state = new Proxy(value, {
    set(target, key, value) {
      const oValue = target[key];
      target[key as keyof typeof target] = value;
      // Dispatch event only when value changed actually.
      if (oValue !== value) {
        if (isArray) {
          et.dispatchEvent(new CustomEvent('*'));
        } else if (typeof key === 'string') {
          et.dispatchEvent(new CustomEvent(key));
        }
      }
      return true;
    },
    get(target, key) {
      if (recording) {
        if (isArray) {
          recording.add(et, '*');
        } else if (typeof key === 'string') {
          recording.add(et, key);
        }
      }
      return Object(target)[key];
    },
  });
  return state;
};
