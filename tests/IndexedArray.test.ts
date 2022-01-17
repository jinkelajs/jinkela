import { IndexedArray } from '../src/IndexedArray';

test('Basic Usage', () => {
  const list = new IndexedArray();
  const a = { a: 1 };
  const b = { b: 2 };
  const c = { c: 3 };
  list.push(a);
  list.push(b);
  list.push(c);

  expect(list.indexOf({ b: 2 })).toBe(-1);
  expect(list.includes({ b: 2 })).toBe(false);
  expect(list.get(3)).toBeNull();

  expect(list.indexOf(a)).toBe(0);
  expect(list.includes(a)).toBe(true);
  expect(list.get(0)).toBe(a);

  expect(list.indexOf(b)).toBe(1);
  expect(list.includes(b)).toBe(true);
  expect(list.get(1)).toBe(b);

  expect(list.indexOf(c)).toBe(2);
  expect(list.includes(c)).toBe(true);
  expect(list.get(2)).toBe(c);

  list.set(2, null);
  expect(list.get(2)).toBeNull();

  expect(list.length).toBe(3);
});

// test('Performance', () => {
//   const length = 1e4;

//   const a = Array.from({ length }, (_, i) => i * 2);

//   const v = a[a.length - 1];

//   const run = (f: () => void) => {
//     const begin = Date.now();
//     f();
//     return Date.now() - begin;
//   };

//   const timeOfArray = run(() => {
//     for (let i = 0; i < length; i++) a.includes(v);
//   });

//   const timeOfIndexedArray = run(() => {
//     const ia = new IndexedArray(a);
//     for (let i = 0; i < length; i++) ia.includes(v);
//   });

//   expect(timeOfArray).toBeGreaterThan(timeOfIndexedArray * 10);
// });
