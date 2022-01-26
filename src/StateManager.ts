import { debounce, removeDebounce } from './debounce';
import { PairSet } from './PairSet';
import { assertDefined, Fn } from './utils';

type Recording = undefined | PairSet<EventTarget, string>;
let recording: Recording = undefined;
const recordingStack: Recording[] = [recording];

const handlerMap = new WeakMap<() => void, PairSet<EventTarget, string>>();
const stateEtMap = new WeakMap<any, EventTarget>();

const executeAndRecordDeps = <T extends () => any>(fn: T, onUpdate: Fn): ReturnType<T> => {
  try {
    // Setup a new recording stack head first, and execute `fn`.
    recordingStack.push(recording);
    recording = new PairSet<EventTarget, string>();
    return fn();
  } finally {
    assertDefined(recording);
    const debouncedOnUpdate = debounce(onUpdate);
    const old = handlerMap.get(onUpdate);
    // Add event listeners for new dependencies.
    recording.forEach((et, name) => {
      if (old?.delete(et, name)) return;
      et.addEventListener(name, debouncedOnUpdate);
    });
    // Remove unused event listeners.
    old?.forEach((et, name) => {
      et.removeEventListener(name, debouncedOnUpdate);
    });
    // Save and recover recording stack head.
    handlerMap.set(onUpdate, recording);
    recording = recordingStack.pop() as Recording;
  }
};

const cleanUpListeners = (onUpdate: Fn) => {
  const recording = handlerMap.get(onUpdate);
  if (!recording) return;
  const debouncedOnUpdate = debounce(onUpdate);
  recording.forEach((et, name) => et.removeEventListener(name, debouncedOnUpdate));
  removeDebounce(onUpdate);
  recording.clear();
  handlerMap.delete(onUpdate);
};

export const touch = (obj: unknown) => {
  assertDefined(recording);
  const et = stateEtMap.get(obj);
  if (!et) return;
  recording.add(et, '*');
};

/**
 * Get and watch value, handler function will be called immediately first time.
 * @returns A 'cancel' function to stop watch.
 */
export const live = <T extends () => any>(fn: T, handler: (value: ReturnType<T>) => void) => {
  // Execute function with `executeAndRecordDeps`.
  // The `update` function will be called while any dependencies change.
  const update = () => {
    // The return value of function will be passed to handler.
    handler(executeAndRecordDeps(fn, update));
  };
  update();
  // Return a 'cancel' function to stop watch.
  return () => cleanUpListeners(update);
};

/**
 * Create a proxied state object, any property values change could be watched.
 */
export const createState = <T extends Record<PropertyKey, any>>(value: T) => {
  const isArray = value instanceof Array;
  const et = new EventTarget();
  const dispatch = (key: string | symbol) => {
    if (isArray) {
      et.dispatchEvent(new CustomEvent('*'));
    } else if (typeof key === 'string') {
      et.dispatchEvent(new CustomEvent('*'));
      et.dispatchEvent(new CustomEvent(key));
    }
  };
  const state = new Proxy(value, {
    set(target, key, value) {
      const oValue = target[key];
      target[key as keyof typeof target] = value;
      // Dispatch event only when value changed actually.
      if (oValue !== value) dispatch(key);
      return true;
    },
    deleteProperty(target, key) {
      // Dispatch event only when value changed actually.
      if (key in target) dispatch(key);
      return delete target[key];
    },
    get(target, key) {
      // Record the property as a dependency, if recording currently.
      if (recording) {
        if (isArray) {
          recording.add(et, '*');
        } else if (typeof key === 'string') {
          recording.add(et, key);
        }
      }
      return target[key];
    },
  });
  stateEtMap.set(state, et);
  return state;
};
