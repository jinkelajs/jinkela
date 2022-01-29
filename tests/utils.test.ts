import { assertDefined, assertInstanceOf, assertNotNull, assertToken, isSelfClosingTag } from '../src/utils';

test('isSelfClosingTag', () => {
  expect(isSelfClosingTag('HR')).toBeTruthy();
  expect(isSelfClosingTag('DIV')).toBeFalsy();
});

test('assertDefined', () => {
  const v: undefined | 1 = 1;
  assertDefined(v);
  const a: 1 = v;
  expect(a).toBe(v);
  assertDefined(1);
  assertDefined(null);
  expect(() => {
    assertDefined(undefined);
  }).toThrow();
});

test('assertNotNull', () => {
  const v: null | 1 = 1;
  assertNotNull(v);
  const a: 1 = v;
  expect(a).toBe(v);
  assertNotNull(undefined);
  expect(() => {
    assertNotNull(null);
  }).toThrow();
});

test('assertToken', () => {
  const v: string = 'a';
  assertToken(v, 'a', 'b');
  let ab: 'a' | 'b' = v;
  expect(ab).toBe(v);
  assertToken(v, 'a');
  let a: 'a' = v;
  expect(a).toBe(v);
  expect(() => {
    assertToken(v, 'c');
  }).toThrow();
});

test('assertInstanceOf', () => {
  const v: null | [] = [];
  assertInstanceOf(v, Array);
  const a: [] = v;
  expect(a).toBe(v);
  expect(() => {
    assertInstanceOf(v, String);
  }).toThrow();
});
