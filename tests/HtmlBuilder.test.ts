import { createState, digestImmediately } from '../src/StateManager';
import { HtmlBuilder } from '../src/HtmlBuilder';
import { assertText, assertComment, assertElement } from './common';

const r = ({ raw }: any, ...vars: any[]) => new HtmlBuilder(raw, vars).root;

test('Content with Variable', () => {
  const state = createState({ v: 1 });
  const strong = document.createElement('strong');
  strong.textContent = 'strong';
  const root = r`
    <div>
      <div>${1}</div>
      <div>${() => 2}</div>
      <span>${() => state.v}</span>
      <div>name: ${'hehe'}</div>
      <div>age: ${new Text('20')}</div>
      ${strong}
    </div>
  `;
  expect(root).toBeInstanceOf(DocumentFragment);
  const div = root.firstElementChild;
  expect(div).toBeInstanceOf(HTMLDivElement);
  const { children = [] } = div || {};
  assertElement(children[0], 'DIV', '1');
  assertElement(children[1], 'DIV', '2');
  assertElement(children[2], 'SPAN', '1');
  assertElement(children[3], 'DIV', 'name: hehe');
  assertElement(children[4], 'DIV', 'age: 20');
  assertElement(children[5], 'STRONG', 'strong');
  state.v++;
  digestImmediately();
  assertElement(children[2], 'SPAN', '2');
});

test('TagName with Variable', () => {
  const root = r`
    <div>
      <h${1}>h1</h${1}>
      <${'strong'}>strong</${'strong'}>
    </div>
  `;
  expect(root).toBeInstanceOf(DocumentFragment);
  const div = root.firstElementChild;
  expect(div).toBeInstanceOf(HTMLDivElement);
  expect(div?.firstElementChild?.tagName).toBe('H1');
  expect(div?.firstElementChild?.textContent).toBe('h1');
  expect(div?.lastElementChild?.tagName).toBe('STRONG');
  expect(div?.lastElementChild?.textContent).toBe('strong');
});

test('Attribute Value with Variable', () => {
  const state = createState({ v: 1 });
  const root = r`
    <div
      data-${'a'}="${1}"
      title="${'title'}"
      style="color: red; font-size: ${12}px;"
      ${'class'}="${'nothing'}"
      v1="${() => state.v}"
    >
    </div>
  `;
  expect(root).toBeInstanceOf(DocumentFragment);
  const div = root.firstElementChild;
  expect(div?.getAttribute('data-a')).toBe('1');
  expect(div?.getAttribute('title')).toBe('title');
  expect(div?.getAttribute('style')).toBe('color: red; font-size: 12px;');
  expect(div?.getAttribute('class')).toBe('nothing');
  expect(div?.getAttribute('v1')).toBe('1');
  state.v++;
  digestImmediately();
  expect(div?.getAttribute('v1')).toBe('2');
});

test('Event Handler', () => {
  const click = jest.fn();
  const root = r`
    <button @click="${click}">+1</button>
  `;
  const button = root.firstElementChild;
  button?.dispatchEvent(new MouseEvent('click'));
  expect(click).toBeCalled();
});

test('Event Handler 2', () => {
  const click1 = jest.fn();
  const click2 = jest.fn();
  const root = r`
    <button @click="${click1} - ${click2}">+1</button>
  `;
  const button = root.firstElementChild;
  button?.dispatchEvent(new MouseEvent('click'));
  expect(click1).toBeCalled();
  expect(click2).toBeCalled();
});

test('Comment', () => {
  const state = createState({ v: 1 });
  const root = r`
    <div>
      <!-- hehe -->
      <!haha>
      <!-- ${123} -->
      <!-- ${() => 456} -->
      <!-- ${() => state.v} -->
      </注释>
      <? php ?>
    </div>
  `;
  const div = root.firstElementChild;
  const { childNodes = [] } = div || {};
  assertText(childNodes[0], '');
  assertComment(childNodes[1], ' hehe ');
  assertText(childNodes[2], '');
  assertComment(childNodes[3], 'haha');
  assertText(childNodes[4], '');
  assertComment(childNodes[5], ' 123 ');
  assertText(childNodes[6], '');
  assertComment(childNodes[7], ' 456 ');

  assertText(childNodes[8], '');
  assertComment(childNodes[9], ' 1 ');
  state.v++;
  digestImmediately();
  assertComment(childNodes[9], ' 2 ');

  assertText(childNodes[10], '');
  assertComment(childNodes[11], '注释');
  assertText(childNodes[12], '');
  assertComment(childNodes[13], '? php ?');
  assertText(childNodes[14], '');
  expect(childNodes[15]).toBeUndefined();
});

test('HTML Entity', () => {
  const root = r`
    <div>
      <span>&#128514;</span>
      <span>&#128514abc</span>
      <span>&copy;</span>
      <span>&copynimei</span>
    </div>
  `;
  const div = root.firstElementChild;
  const { children = [] } = div || {};
  expect(children[0]).toBeInstanceOf(HTMLSpanElement);
  expect(children[0].textContent).toBe('😂');
  expect(children[1]).toBeInstanceOf(HTMLSpanElement);
  expect(children[1].textContent).toBe('😂abc');
  expect(children[2]).toBeInstanceOf(HTMLSpanElement);
  expect(children[2].textContent).toBe('©');
  expect(children[3]).toBeInstanceOf(HTMLSpanElement);
  expect(children[3].textContent).toBe('©nimei');
});

test('Self-Closing Tags', () => {
  const root = r`
    <hr>
    <hr/>
    <hr />
  `;
  const { children = [] } = root || {};
  expect(children[0]).toBeInstanceOf(HTMLHRElement);
  expect(children[1]).toBeInstanceOf(HTMLHRElement);
  expect(children[2]).toBeInstanceOf(HTMLHRElement);
});

test('Close Parent Element', () => {
  const root = r`
    <div>
      <a>link</a>
      <strong>haha
    </div>
  `;
  const div = root.firstElementChild;
  const { children = [] } = div || {};
  assertElement(children[0], 'A', 'link');
  assertElement(children[1], 'STRONG', 'haha');
});

test('Attributes without Value', () => {
  const root = r`
    <strong a></strong b c>
    <hr a/>
    <input disabled />
  `;
  const { children = [] } = root;
  expect(children[0]).toBeInstanceOf(HTMLElement);
  expect(children[0].getAttribute('a')).toBe('');
  expect(children[1]).toBeInstanceOf(HTMLHRElement);
  expect(children[1].getAttribute('a')).toBe('');
  expect(children[2]).toBeInstanceOf(HTMLInputElement);
  expect(children[2].getAttribute('disabled')).toBe('');
});

test('Too Many Attributes', () => {
  const a = Array.from({ length: 1000 }, (_, i) => `x${i}`).join(' ');
  new HtmlBuilder([`<meta ${a} />`], []);
  expect(() => {
    const a = Array.from({ length: 1001 }, (_, i) => `x${i}`).join(' ');
    new HtmlBuilder([`<meta ${a} />`], []);
  }).toThrow();
});

test('Malformed Tags', () => {
  const root = r`
    <div>
      <123>
      <custom-tag>custom</custom-tag>
      <x恭喜发财>xxx</x恭喜发财>
      <恭喜发财>恭喜发财</恭喜发财>
      </wtf a="hehe">
    </div>
  `;
  const div = root.firstElementChild;
  const { childNodes = [] } = div || {};
  assertText(childNodes[0], '<123>');
  assertElement(childNodes[1], 'CUSTOM-TAG', 'custom');
  assertText(childNodes[2], '');
  assertElement(childNodes[3], 'X恭喜发财', 'xxx');
  assertText(childNodes[4], '<恭喜发财>恭喜发财');
  assertComment(childNodes[5], '恭喜发财');
  assertText(childNodes[6], '');
  assertText(childNodes[7], '');
  expect(childNodes[8]).toBeUndefined();
});

test('Malformed Attributes', () => {
  const root = r`
    <div
      a=1
      b  =2
      c=  3
      d  =  4
      e  =  "5"
      f  =  "  6"
      g  =   '  7 '
      = NO_NAME_WILL_BE_IGNORED_1
      = NO_NAME_WILL_BE_IGNORED_2
      x = y z
      o = m/n
      p = m'"n
      q = '>'
      恭喜 = 发财
      ${'v'} = ${123}
      ${'v'}1 = ${124}px
      x${'v'}2 = [[${125}
      end = [[>${126}
    ></div>
  `;
  const div = root.firstElementChild;
  if (!div) throw new Error('wtf');
  expect(div.getAttribute('a')).toBe('1');
  expect(div.getAttribute('b')).toBe('2');
  expect(div.getAttribute('c')).toBe('3');
  expect(div.getAttribute('d')).toBe('4');
  expect(div.getAttribute('e')).toBe('5');
  expect(div.getAttribute('f')).toBe('  6');
  expect(div.getAttribute('g')).toBe('  7 ');
  expect(div.getAttribute('')).toBe(null); // NO_NAME_WILL_BE_IGNORED
  expect(div.getAttribute('x')).toBe('y');
  expect(div.getAttribute('z')).toBe('');
  expect(div.getAttribute('o')).toBe('m/n');
  expect(div.getAttribute('p')).toBe('m\'"n');
  expect(div.getAttribute('q')).toBe('>');
  expect(div.getAttribute('恭喜')).toBe('发财');
  expect(div.getAttribute('v')).toBe('123');
  expect(div.getAttribute('v1')).toBe('124px');
  expect(div.getAttribute('xv2')).toBe('[[125');
  expect(div.getAttribute('end')).toBe('[[');
  expect(div.textContent?.replace(/\s/g, '')).toBe('126>');
});

test('Object Attributes Assign', () => {
  const e1 = r`<div ${{ a: 1, b: 2 }}></div ${{ a: 1, b: 2 }}>`.firstElementChild;
  expect(e1?.getAttribute('a')).toBe('1');
  expect(e1?.getAttribute('b')).toBe('2');

  const e2 = r`<div ${{ a: 1, b: 2 }} ></div ${{ a: 1, b: 2 }} >`.firstElementChild;
  expect(e2?.getAttribute('a')).toBe('1');
  expect(e2?.getAttribute('b')).toBe('2');

  const e3 = r`<meta ${{ a: 1, b: 2 }}/>`.firstElementChild;
  expect(e3?.getAttribute('a')).toBe('1');
  expect(e3?.getAttribute('b')).toBe('2');

  const e4 = r`<meta ${{ a: 1, toString: () => 'ok' }}ey />`.firstElementChild;
  expect(e4?.getAttribute('a')).toBe(null);
  expect(e4?.getAttribute('okey')).toBe('');

  const e5 = r`<meta no-${{ a: 1, toString: () => 'ok' }} />`.firstElementChild;
  expect(e5?.getAttribute('a')).toBe(null);
  expect(e5?.getAttribute('no-ok')).toBe('');

  const e6 = r`<meta ${{ a: 1, b: undefined, c: null }} />`.firstElementChild;
  expect(e6?.getAttribute('a')).toBe('1');
  expect(e6?.getAttribute('b')).toBe(null);
  expect(e6?.getAttribute('c')).toBe(null);
});

test('EOF', () => {
  assertElement(r`<div>ccc</di`.firstChild, 'DIV', 'ccc');
  assertElement(r`<div>ccc</`.firstChild, 'DIV', 'ccc</');
  assertElement(r`<div>ccc<`.firstChild, 'DIV', 'ccc<');
  assertElement(r`<div>ccc`.firstChild, 'DIV', 'ccc');
  assertText(r`</`.firstChild, '</');
  assertText(r`<`.firstChild, '<');
  expect(r`<a`.firstChild).toBeNull();
  assertText(r`&copy;`.firstChild, '©');
  assertText(r`&copy`.firstChild, '©');
  assertText(r`&cop`.firstChild, '&cop');
  assertText(r`&`.firstChild, '&');
  assertText(r`a&`.firstChild, 'a&');

  expect(r`<div`.firstElementChild).toBeNull();
  expect(r`<div `.firstElementChild).toBeNull();
  expect(r`<div a`.firstElementChild).toBeNull();
  expect(r`<div a=`.firstElementChild).toBeNull();
  expect(r`<div a=1`.firstElementChild).toBeNull();
  expect(r`<div @`.firstElementChild).toBeNull();
  expect(r`<div @a`.firstElementChild).toBeNull();
  expect(r`<div ${1}`.firstElementChild).toBeNull();
});
