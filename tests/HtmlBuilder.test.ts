import { createState } from '../src/StateManager';
import { digestImmediately } from '../src/debounce';
import { HtmlBuilder } from '../src/HtmlBuilder';
import { assertText, assertComment, assertElement } from './common';
import { assertInstanceOf } from '../src/utils';

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

describe('Attributes', () => {
  test('Variables', () => {
    const state = createState({ v: 1 });
    const root = r`
      <div
        data-${'a'}="${1}"
        title="${'title'}"
        style="color: red; font-size: ${12}px;"
        ${'class'}="${'nothing'}"
        v1="${() => state.v}"
        a${() => state.v}="hehe"
        ${{ toString: () => 'data-' }}hehe="123"
        ${() => 'disabled'}
      >
      </div>
    `;
    expect(root).toBeInstanceOf(DocumentFragment);
    const div = root.firstElementChild;
    expect(div?.getAttribute('data-a')).toBe('1');
    expect(div?.getAttribute('title')).toBe('title');
    expect(div?.getAttribute('style')).toBe('color: red; font-size: 12px;');
    expect(div?.getAttribute('class')).toBe('nothing');
    expect(div?.getAttribute('data-hehe')).toBe('123');
    expect(div?.getAttribute('v1')).toBe('1');
    expect(div?.getAttribute('a1')).toBe('hehe');
    expect(div?.getAttribute('a2')).toBe(null);
    expect(div?.getAttribute('disabled')).toBe('');
    state.v++;
    digestImmediately();
    expect(div?.getAttribute('a1')).toBe(null);
    expect(div?.getAttribute('a2')).toBe('hehe');
    expect(div?.getAttribute('v1')).toBe('2');
  });

  test('without Value', () => {
    const root = r`
      <strong a></strong b c>
      <hr a/>
      <input disabled />
      <input dis${'abled'} />
      <input ${'disabled'} />
      <input ${{ toString: () => 'dis' }}abled />
      <input ${null} />
    `;
    const { children = [] } = root;
    expect(children[0]).toBeInstanceOf(HTMLElement);
    expect(children[0].getAttribute('a')).toBe('');
    expect(children[1]).toBeInstanceOf(HTMLHRElement);
    expect(children[1].getAttribute('a')).toBe('');
    expect(children[2]).toBeInstanceOf(HTMLInputElement);
    expect(children[2].getAttribute('disabled')).toBe('');
    expect(children[3]).toBeInstanceOf(HTMLInputElement);
    expect(children[3].getAttribute('disabled')).toBe('');
    expect(children[4]).toBeInstanceOf(HTMLInputElement);
    expect(children[4].getAttribute('disabled')).toBe('');
    expect(children[5]).toBeInstanceOf(HTMLInputElement);
    expect(children[5].getAttribute('disabled')).toBe('');
    expect(children[6]).toBeInstanceOf(HTMLInputElement);
    expect(children[6].attributes.length).toBe(0);
  });

  test('with Name-Value Pairs', () => {
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

  test('with Spread', () => {
    const e1 = r`<div ${{ a: 1, b: () => 1 }}></div>`.firstElementChild;
    expect(e1?.getAttribute('a')).toBe('1');
    expect(e1?.getAttribute('b')).toBe('() => 1');
  });

  test('with Spread Variable', () => {
    const attrs = createState({ a: 1 } as any);
    const e1 = r`<div ${attrs}></div>`.firstElementChild;
    expect(e1?.getAttribute('a')).toBe('1');
    expect(e1?.getAttribute('b')).toBe(null);
    attrs.b = 2;
    digestImmediately();
    expect(e1?.getAttribute('a')).toBe('1');
    expect(e1?.getAttribute('b')).toBe('2');
    delete attrs.a;
    digestImmediately();
    expect(e1?.getAttribute('a')).toBe(null);
    expect(e1?.getAttribute('b')).toBe('2');
  });

  describe('Override Rules', () => {
    test('Right Spread Attributes Override Left Normal Attributes', () => {
      const e1 = r`<div a="1" ${{ a: 2, b: 2 }}></div>`.firstElementChild;
      expect(e1?.getAttribute('a')).toBe('2');
      expect(e1?.getAttribute('b')).toBe('2');
    });

    test('Right Normal Attributes Override Left Spread Attributes', () => {
      const e2 = r`<div ${{ a: 2, b: 2 }} a="1"></div>`.firstElementChild;
      expect(e2?.getAttribute('a')).toBe('1');
      expect(e2?.getAttribute('b')).toBe('2');
    });

    test('Variable Update Cannot Break Override Rules', () => {
      const s3 = createState({ v: { a: 2, b: 2 }, x: 1 as any });
      const e3 = r`<div ${() => s3.v} a="${() => s3.x}"></div>`.firstElementChild;
      expect(e3?.getAttribute('a')).toBe('1');
      expect(e3?.getAttribute('b')).toBe('2');
      s3.v = { a: 3, b: 3 };
      digestImmediately();
      expect(e3?.getAttribute('a')).toBe('1');
      expect(e3?.getAttribute('b')).toBe('3');
      s3.x = 4;
      digestImmediately();
      expect(e3?.getAttribute('a')).toBe('4');
      expect(e3?.getAttribute('b')).toBe('3');
    });

    test('Spread Attributes can be Null', () => {
      const s3 = createState({ v: { a: 2, b: 2 } as any, x: 1 as any });
      const e3 = r`<div a="${() => s3.x}" ${() => s3.v}></div>`.firstElementChild;
      expect(e3?.getAttribute('a')).toBe('2');
      expect(e3?.getAttribute('b')).toBe('2');
      s3.v = { b: 2 };
      digestImmediately();
      expect(e3?.getAttribute('a')).toBe('1');
      expect(e3?.getAttribute('b')).toBe('2');
      s3.v = null;
      s3.x = 4;
      digestImmediately();
      expect(e3?.getAttribute('a')).toBe('4');
      expect(e3?.getAttribute('b')).toBe(null);
    });
  });

  test('Too many attributes', () => {
    expect(() => {
      const attrs = Array.from({ length: 1001 }, (_, i) => `a${i}`).join(' ');
      new HtmlBuilder([`<meta ${attrs} />`], []);
    }).toThrowError();
  });
});

describe('Event Handler', () => {
  test('Button Click', () => {
    const click = jest.fn();
    const root = r`<button @click="${click}">+1</button>`;
    const button = root.firstElementChild;
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click).toBeCalled();
  });

  test('Bind 2 Hanlders on One Attribute', () => {
    const click1 = jest.fn();
    const click2 = jest.fn();
    const root = r`<button @click="${click1} - ${click2}">+1</button>`;
    const button = root.firstElementChild;
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click1).toBeCalled();
    expect(click2).toBeCalled();
  });

  test('with Spread Attributes', () => {
    const click0 = jest.fn();
    const click1 = jest.fn();
    const s = createState({
      attrs: { '@click': click1 } as any,
    });
    const button = r`<button @click="${click0}" ${() => s.attrs}>+1</button>`.firstElementChild;
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click0).toHaveBeenCalledTimes(0);
    expect(click1).toHaveBeenCalledTimes(1);

    // Change listener.
    const click2 = jest.fn();
    s.attrs = { '@click': click2 };
    digestImmediately();
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click0).toHaveBeenCalledTimes(0);
    expect(click1).toHaveBeenCalledTimes(1);
    expect(click2).toHaveBeenCalledTimes(1);

    // Listener should be removed.
    s.attrs = null;
    digestImmediately();
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click0).toHaveBeenCalledTimes(1);
    expect(click1).toHaveBeenCalledTimes(1);
    expect(click2).toHaveBeenCalledTimes(1);
  });

  test('with Listener List Change', () => {
    const click1 = jest.fn();
    const s = createState({
      attrs: { '@click': click1 } as any,
    });
    const button = r`<button ${() => s.attrs}>+1</button>`.firstElementChild;
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click1).toHaveBeenCalledTimes(1);

    // Add click2 to listener list.
    const click2 = jest.fn();
    s.attrs = { '@click': [click1, click2] };
    digestImmediately();
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click1).toHaveBeenCalledTimes(2);
    expect(click2).toHaveBeenCalledTimes(1);

    // Remove click1 from listener list.
    s.attrs = { '@click': click2 };
    digestImmediately();
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click1).toHaveBeenCalledTimes(2);
    expect(click2).toHaveBeenCalledTimes(2);

    // Remove all listeners.
    s.attrs = {};
    digestImmediately();
    button?.dispatchEvent(new MouseEvent('click'));
    expect(click1).toHaveBeenCalledTimes(2);
    expect(click2).toHaveBeenCalledTimes(2);
  });
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
      ${{ toString: () => 'obj' }} = ${123}
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
  expect(div.getAttribute('obj')).toBe('123');
  expect(div.getAttribute('v')).toBe('123');
  expect(div.getAttribute('v1')).toBe('124px');
  expect(div.getAttribute('xv2')).toBe('[[125');
  expect(div.getAttribute('end')).toBe('[[');
  expect(div.textContent?.replace(/\s/g, '')).toBe('126>');
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

test('Svg', () => {
  const { firstElementChild: svg } = r`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect x="0" y="20" width="100" height="20" />
      <g fill="red">
        <rect x="0" y="60" width="100" height="20" />
      </g>
    </svg>`;
  expect(svg).toBeInstanceOf(SVGElement);
  const { children = [] } = svg || {};
  expect(children[0].tagName).toBe('rect');
  expect(children[1].tagName).toBe('g');
  expect(children[1].firstElementChild?.tagName).toBe('rect');

  const xmlns = 'http://www.w3.org/2000/svg';
  const { firstElementChild: svg2 } = r`<svg ${{ xmlns, width: '200' }}></svg>`;
  expect(svg2).toBeInstanceOf(SVGElement);
  assertInstanceOf(svg2, SVGElement);
  expect(svg2.namespaceURI).toBe(xmlns);
  expect(svg2.getAttribute('width')).toBe('200');
});

test('Style', () => {
  const s = createState({ v: 'wtf' });
  const { firstElementChild: style } = r`
    <style>
      <script> /* noop &amp; */ </script>
      <!-- ${() => s.v} -->
    </style>`;
  expect(style).toBeInstanceOf(HTMLStyleElement);
  expect(style?.textContent?.replace(/\s+/g, ' ')).toBe(' <script> /* noop &amp; */ </script> <!-- wtf --> ');
  s.v = 'hehe';
  digestImmediately();
  expect(style?.textContent?.replace(/\s+/g, ' ')).toBe(' <script> /* noop &amp; */ </script> <!-- hehe --> ');
});

test('Textarea', () => {
  const s = createState({ v: 'wtf' });
  const { firstElementChild: textarea } = r`
    <textarea>
      <script> /* noop &amp; */ </script>
      <!-- ${() => s.v} -->
    </textarea>`;
  expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
  if (!(textarea instanceof HTMLTextAreaElement)) throw new Error('??');
  expect(textarea?.value?.replace(/\s+/g, ' ')).toBe(' <script> /* noop & */ </script> <!-- wtf --> ');
  s.v = 'hehe';
  digestImmediately();
  expect(textarea?.textContent?.replace(/\s+/g, ' ')).toBe(' <script> /* noop & */ </script> <!-- hehe --> ');
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
  expect(r`<div ${{}}`.firstElementChild).toBeNull();

  expect(r`<style><`.firstElementChild?.textContent).toBe('<');
  expect(r`<style></`.firstElementChild?.textContent).toBe('</');
  expect(r`<style></style`.firstElementChild?.textContent).toBe('</style');
});
