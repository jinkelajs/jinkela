import { PairSet } from '../src/PairSet';

test('Basic Usage', () => {
  const s = new PairSet<number, number>();
  s.add(1, 1);
  s.add(1, 2);
  s.add(2, 1);
  s.add(2, 2);
  s.add(1, 1);
  s.add(1, 2);
  s.add(2, 1);
  s.add(2, 2);
  const f1 = jest.fn();
  s.forEach(f1);
  expect(f1).toBeCalledTimes(4);
  expect(f1).toBeCalledWith(1, 1);
  expect(f1).toBeCalledWith(1, 2);
  expect(f1).toBeCalledWith(2, 1);
  expect(f1).toBeCalledWith(2, 2);

  expect(s.delete(1, 2)).toBeTruthy();
  expect(s.delete(9, 9)).toBeFalsy();
  const f2 = jest.fn();
  s.forEach(f2);
  expect(f2).toBeCalledTimes(3);
  expect(f2).toBeCalledWith(1, 1);
  expect(f2).toBeCalledWith(2, 1);
  expect(f2).toBeCalledWith(2, 2);

  s.delete(2, 1);
  const f3 = jest.fn();
  s.forEach(f3);
  expect(f3).toBeCalledTimes(2);
  expect(f3).toBeCalledWith(1, 1);
  expect(f3).toBeCalledWith(2, 2);

  s.add(3, 3);
  s.delete(1, 1);
  const f4 = jest.fn();
  s.forEach(f4);
  expect(f4).toBeCalledTimes(2);
  expect(f4).toBeCalledWith(2, 2);
  expect(f4).toBeCalledWith(3, 3);
});
