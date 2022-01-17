import { domListAssign } from '../src/domListAssign';
import { IndexedArray } from '../src/IndexedArray';
import { assertComment, assertElement, assertText } from './common';

test('Basic Usage', () => {
  const div = document.createElement('div');
  const comment = document.createComment(' init ');
  div.appendChild(comment);
  const { childNodes = [] } = div;

  let list = new IndexedArray<Node>([comment]);

  list = domListAssign(list, ['name: ', 'hehe', document.createElement('br'), 'price: ', 123]);
  assertText(childNodes[0], 'name:');
  assertText(childNodes[1], 'hehe');
  assertElement(childNodes[2], 'BR', '');
  assertText(childNodes[3], 'price:');
  assertText(childNodes[4], '123');

  list = domListAssign(list, []);
  assertComment(childNodes[0], ' empty list ');

  const f1 = document.createDocumentFragment();
  f1.appendChild(document.createTextNode('name: '));
  f1.appendChild(document.createTextNode('hehe'));
  const f2 = document.createDocumentFragment();
  f2.appendChild(document.createTextNode('price: '));
  f2.appendChild(document.createTextNode('123'));
  const br = document.createElement('br');
  list = domListAssign(list, [f1, br, null, f2]);
  assertText(childNodes[0], 'name:');
  assertText(childNodes[1], 'hehe');
  assertElement(childNodes[2], 'BR', '');
  assertComment(childNodes[3], ' null ');
  assertText(childNodes[4], 'price:');
  assertText(childNodes[5], '123');

  list = domListAssign(list, []);
  assertComment(childNodes[0], ' empty list ');

  list = domListAssign(list, [f2, document.createElement('br'), f1]);
  assertText(childNodes[0], 'price:');
  assertText(childNodes[1], '123');
  assertElement(childNodes[2], 'BR', '');
  assertText(childNodes[3], 'name:');
  assertText(childNodes[4], 'hehe');
});

test('Add and Remove', () => {
  const div = document.createElement('div');
  const { children = [] } = div;
  const comment = document.createComment(' init ');
  div.appendChild(comment);
  let list = new IndexedArray<Node>([comment]);
  const example = [] as Element[];
  for (let i = 1; i <= 7; i++) {
    example.push(document.createElement('x' + i));
    list = domListAssign(list, example);
    expect(Array.from(children, (i) => i.tagName)).toMatchObject(example.map((i) => i.tagName));
    example.reverse();
    list = domListAssign(list, example);
    expect(Array.from(children, (i) => i.tagName)).toMatchObject(example.map((i) => i.tagName));
    example.reverse();
  }
  while (example.length) {
    example.pop();
    list = domListAssign(list, example);
    expect(Array.from(children, (i) => i.tagName)).toMatchObject(example.map((i) => i.tagName));
    example.reverse();
    list = domListAssign(list, example);
    expect(Array.from(children, (i) => i.tagName)).toMatchObject(example.map((i) => i.tagName));
    example.reverse();
  }
});

test('Insert', () => {
  const div = document.createElement('div');
  const { children = [] } = div;
  const comment = document.createComment(' init ');
  div.appendChild(comment);
  let list = new IndexedArray<Node>([comment]);
  const a = document.createElement('A');
  const b = document.createElement('B');
  const c = document.createElement('C');
  const d = document.createElement('D');
  const e = document.createElement('E');
  const f = document.createElement('F');
  const g = document.createElement('G');
  const h = document.createElement('H');

  list = domListAssign(list, [c, f]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['C', 'F']);

  list = domListAssign(list, [a, b, c, d, e, f, g, h]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

  list = domListAssign(list, [c, f]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['C', 'F']);

  list = domListAssign(list, [a, b, d, e, f, g, h]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['A', 'B', 'D', 'E', 'F', 'G', 'H']);
});

test('Sort', () => {
  const div = document.createElement('div');
  const { children = [] } = div;
  const comment = document.createComment(' init ');
  div.appendChild(comment);
  let list = new IndexedArray<Node>([comment]);
  const a = document.createElement('A');
  const b = document.createElement('B');
  const c = document.createElement('C');
  const insertBefore = jest.spyOn(div, 'insertBefore');
  const removeChild = jest.spyOn(div, 'removeChild');

  list = domListAssign(list, [a, b, c]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['A', 'B', 'C']);
  expect(insertBefore).toHaveBeenCalledTimes(3);
  expect(removeChild).toHaveBeenCalledTimes(1);
  insertBefore.mockClear();
  removeChild.mockClear();

  list = domListAssign(list, [c, b, a]);
  expect(removeChild).toHaveBeenCalledTimes(0);
  expect(insertBefore).toHaveBeenCalledTimes(2);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['C', 'B', 'A']);
  insertBefore.mockClear();
  removeChild.mockClear();

  list = domListAssign(list, [c, a, b]);
  expect(removeChild).toHaveBeenCalledTimes(0);
  expect(insertBefore).toHaveBeenCalledTimes(1);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['C', 'A', 'B']);
  insertBefore.mockClear();
  removeChild.mockClear();

  insertBefore.mockReset();
  removeChild.mockReset();
  insertBefore.mockRestore();
  removeChild.mockRestore();
});

test('Sort, within BEGIN-END Elements Pair', () => {
  const div = document.createElement('div');
  const { children = [] } = div;
  const comment = document.createComment(' init ');
  div.appendChild(document.createElement('begin'));
  div.appendChild(comment);
  div.appendChild(document.createElement('end'));
  let list = new IndexedArray<Node>([comment]);
  const a = document.createElement('A');
  const b = document.createElement('B');
  const c = document.createElement('C');
  const insertBefore = jest.spyOn(div, 'insertBefore');
  const removeChild = jest.spyOn(div, 'removeChild');

  list = domListAssign(list, [a, b, c]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['BEGIN', 'A', 'B', 'C', 'END']);
  expect(insertBefore).toHaveBeenCalledTimes(3);
  expect(removeChild).toHaveBeenCalledTimes(1);
  insertBefore.mockClear();
  removeChild.mockClear();

  list = domListAssign(list, [c, b, a]);
  expect(removeChild).toHaveBeenCalledTimes(0);
  expect(insertBefore).toHaveBeenCalledTimes(2);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['BEGIN', 'C', 'B', 'A', 'END']);
  insertBefore.mockClear();
  removeChild.mockClear();

  list = domListAssign(list, [c, a, b]);
  expect(removeChild).toHaveBeenCalledTimes(0);
  expect(insertBefore).toHaveBeenCalledTimes(1);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['BEGIN', 'C', 'A', 'B', 'END']);
  insertBefore.mockClear();
  removeChild.mockClear();

  insertBefore.mockReset();
  removeChild.mockReset();
  insertBefore.mockRestore();
  removeChild.mockRestore();
});

test('Sort, Special Case', () => {
  const div = document.createElement('div');
  const { children = [] } = div;
  const a = document.createElement('A');
  const b = document.createElement('B');
  const c = document.createElement('C');
  const d = document.createElement('D');
  const I = document.createElement('I');
  div.appendChild(a);
  div.appendChild(I);
  div.appendChild(b);
  div.appendChild(c);
  div.appendChild(d);
  let list = new IndexedArray<Node>([a, I, b, c, d]);
  const insertBefore = jest.spyOn(div, 'insertBefore');
  const removeChild = jest.spyOn(div, 'removeChild');

  list = domListAssign(list, [d, a, b, c]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['D', 'A', 'B', 'C']);
  expect(insertBefore).toHaveBeenCalledTimes(1);
  expect(removeChild).toHaveBeenCalledTimes(1);
  insertBefore.mockClear();
  removeChild.mockClear();

  insertBefore.mockReset();
  removeChild.mockReset();
  insertBefore.mockRestore();
  removeChild.mockRestore();
});

test('Sort, at Worst', () => {
  const div = document.createElement('div');
  const { children = [] } = div;
  const a = document.createElement('A');
  const b = document.createElement('B');
  const c = document.createElement('C');
  const d = document.createElement('D');
  div.appendChild(a);
  div.appendChild(b);
  div.appendChild(c);
  div.appendChild(d);
  let list = new IndexedArray<Node>([a, b, c, d]);
  const insertBefore = jest.spyOn(div, 'insertBefore');
  const removeChild = jest.spyOn(div, 'removeChild');

  list = domListAssign(list, [b, c, d, a]);
  expect(Array.from(children, (i) => i.tagName)).toMatchObject(['B', 'C', 'D', 'A']);
  expect(insertBefore).toHaveBeenCalledTimes(3);
  insertBefore.mockClear();
  removeChild.mockClear();

  insertBefore.mockReset();
  removeChild.mockReset();
  insertBefore.mockRestore();
  removeChild.mockRestore();
});
