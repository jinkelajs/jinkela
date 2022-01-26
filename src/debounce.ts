import { Fn } from './utils';

const cache = new WeakMap<Fn, Fn>();
const waitingSet = new Set<Fn>();

export const debounce = (fn: Fn) => {
  // Try to get from cache first.
  let dfn = cache.get(fn);
  if (dfn) return dfn;
  // Create `dfn`
  dfn = () => {
    // Has been called, don't performs it duplicately.
    if (waitingSet.has(fn)) return;
    // Put it to waitingSet and waiting for next tick.
    waitingSet.add(fn);
    Promise.resolve().then(() => {
      // Has removed from waitingSet, that may be `digestImmediately` or `removeDebounce`, nothing to do.
      if (!waitingSet.has(fn)) return;
      // Remove it from waitingSet and execute `fn`.
      waitingSet.delete(fn);
      fn();
    });
  };
  // Cache it, don't create `dfn` duplicately.
  // The sets {fn} and {dfb} must be a bijective mapping.
  cache.set(fn, dfn);
  return dfn;
};

export const removeDebounce = (fn: Fn) => {
  cache.delete(fn);
  waitingSet.delete(fn);
};

export const digestImmediately = () => {
  waitingSet.forEach((fn) => {
    // Remove it from waitingSet and execute `fn`.
    waitingSet.delete(fn);
    fn();
  });
};
