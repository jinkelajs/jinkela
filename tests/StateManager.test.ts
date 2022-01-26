import { createState, live } from '../src/StateManager';
import { digestImmediately } from '../src/debounce';

test('Array Push', async () => {
  const arr = createState<number[]>([]);
  const update = jest.fn();
  live(() => {
    return arr.length;
  }, update);
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenNthCalledWith(1, 0);
  arr.push(1);
  arr.push(1);
  expect(update).toHaveBeenCalledTimes(1);
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenNthCalledWith(2, 2);
  arr.push(1);
  arr.push(1);
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(3);
  expect(update).toHaveBeenNthCalledWith(3, 4);
});

test('Digest Asynchronously', async () => {
  const state1 = createState({ a: 1 });
  const state2 = createState({ b: 1 });
  const update = jest.fn();
  live(() => {
    return state1.a + state2.b;
  }, update);
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenNthCalledWith(1, 2);
  state1.a = 2;
  state1.a = 3;
  state1.a = 4;
  state2.b = 2;
  state2.b = 3;
  state2.b = 4;
  expect(update).toHaveBeenCalledTimes(1);
  await new Promise((f) => setTimeout(f));
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenNthCalledWith(2, 8);
});

test('Dependencies Change', async () => {
  const s1 = createState({ a: 0 });
  const s2 = createState({ b: 0 });
  const update = jest.fn();
  live(() => {
    if (s1.a % 2) {
      return s1.a + s2.b;
    } else {
      return s1.a;
    }
  }, update);
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenNthCalledWith(1, 0);
  // Now, the s1%2 is 0, so the s2 is not in the dependencies list.
  // Change the s2 cannot trigger update.
  s2.b++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(1);
  // Increase s1. Now s1%2 is 1, s2 will be add to the dependencies list.
  s1.a++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenNthCalledWith(2, 2);
  // So, update will be triggered when s2 change.
  s2.b++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(3);
  expect(update).toHaveBeenNthCalledWith(3, 3);
  // Increase s1 to 2. Now s1%2 is 0, s2 will be remove from the dependencies list again.
  s1.a++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(4);
  expect(update).toHaveBeenNthCalledWith(4, 2);
  // Change the s2 cannot trigger update.
  s2.b++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(4);
});

test('Ignore Symbol Property', async () => {
  const k = Symbol();
  const s = createState({ a: 1, [k]: 1 });
  const update = jest.fn();
  live(() => {
    return s[k] + s.a;
  }, update);
  expect(update).toHaveBeenCalledTimes(1);
  s.a++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
  // Symbol property change cannot triggger update.
  s[k]++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
});

test('Value Change Actually', async () => {
  const s = createState({ a: 1 });
  const update = jest.fn();
  live(() => {
    return s.a;
  }, update);
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenNthCalledWith(1, 1);
  // Same value assigned, nothing changed.
  s.a = 1;
  expect(update).toHaveBeenCalledTimes(1);
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(1);
  s.a = 2;
  expect(update).toHaveBeenCalledTimes(1);
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenNthCalledWith(2, 2);
});

test('Live and Cancel', async () => {
  const s = createState({ a: 1 });
  const update = jest.fn();
  const cancel = live(() => s.a, update);
  expect(update).toHaveBeenCalledTimes(1);
  expect(update).toHaveBeenNthCalledWith(1, 1);
  s.a++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenNthCalledWith(2, 2);
  s.a++;
  cancel();
  s.a++;
  digestImmediately();
  expect(update).toHaveBeenCalledTimes(2);
  cancel(); // Nothing to do
});
