import {
  assertDefined,
  assertInstanceOf,
  assertNotNull,
  assertToken,
  isSelfClosingTag,
  isValueType,
  v2v,
  vl2s,
} from './utils';
import type { SlotVar } from './utils';
import { live, touch } from './StateManager';
import { StringBuilder } from './StringBuilder';
import { BasicBuilder } from './BasicBuilder';
import { domListAssign } from './domListAssign';
import { IndexedArray } from './IndexedArray';
import { AttributesManager } from './AttributesManager';

const isNotAlpha = RegExp.prototype.test.bind(/[^a-zA-Z0-9]/);

const rawTextTagNames = new Set(['STYLE', 'XMP', 'IFRAME', 'NOEMBED', 'NOFRAMES', 'SCRIPT', 'NOSCRIPT']);

const rcDataTagNames = new Set(['TITLE', 'TEXTAREA']);

interface ReadAttributes {
  /**
   * 0: EOF
   * 1: Normal Element
   * 2: Self-Closing Element
   */
  state: 0 | 1 | 2;
  attrsManager: AttributesManager;
}

export class HtmlBuilder extends BasicBuilder {
  public root = document.createDocumentFragment();
  private current: Node = this.root;

  private readContent() {
    const sb = new StringBuilder((s: string) => {
      this.current.appendChild(document.createTextNode(s));
    });
    for (;;) {
      if (this.done) {
        sb.commit();
        break;
      }
      const c = this.look();
      // Tag or Comment.
      if (c === '<') {
        const h3 = this.look(3);
        assertDefined(h3);
        // It's a comment, such as <!xxx>, or <?xxx>, or <!--xxx-->.
        if (h3[1] === '!' || h3[1] === '?') {
          sb.commit();
          this.readComment();
        } else {
          const hasSlash = h3[1] === '/';
          const leading = hasSlash ? h3[2] : h3[1];
          // It's probably a variable tag, if no leading character found, such as <${x}>.
          // It's a tag, if starts with ASCII alpha characters, such as <div>.
          if (!leading || /[a-zA-Z]/.test(leading)) {
            sb.commit();
            this.readTag();
          }
          // It's a comment, if starts with slash, such as </注释>.
          else if (hasSlash) {
            sb.commit();
            this.readComment();
          }
          // It's a text, such as <123>.
          else {
            this.read();
            sb.append(c);
          }
        }
      }
      // HTML Entity.
      else if (c === '&') {
        sb.append(this.readEntity());
      }
      // Variable.
      else if (!c) {
        sb.commit();
        this.read();
        // Create a comment node as placeholder.
        const cmt = document.createComment(` slot ${this.index} `);
        this.current.appendChild(cmt);
        // The list must not be empty in any time.
        let list = new IndexedArray<Node>([cmt]);
        const variable = this.getVariable();
        live(
          () => {
            const value = v2v(variable);
            touch(value);
            return value;
          },
          (value) => (list = domListAssign(list, value)),
        );
      }
      // Normal char.
      else {
        this.read();
        sb.append(c);
      }
    }
  }

  /**
   * https://html.spec.whatwg.org/multipage/parsing.html#rcdata-state
   * https://html.spec.whatwg.org/multipage/parsing.html#rawtext-state
   */
  private readRawData(parseEntity = false) {
    assertInstanceOf(this.current, HTMLElement);
    const list: SlotVar[] = [];
    const { tagName } = this.current;
    for (;;) {
      list.push(...this.readUntil('<&'));
      if (this.done) break;
      // Find closing tag.
      if (this.look(2) === '</') {
        const info = this.readTagName();
        if (!this.done && tagName === info.tagName.toUpperCase()) {
          this.readAttributes();
          break;
        } else {
          list.push('</' + info.tagName);
        }
      } else if (parseEntity && this.look() === '&') {
        list.push(this.readEntity());
      } else {
        list.push(this.read());
      }
    }

    let node: Text;
    live(
      () => vl2s(list),
      (text) => {
        if (node) {
          node.data = text;
        } else {
          node = document.createTextNode(text);
          this.current.appendChild(node);
          const { parentNode } = this.current;
          assertNotNull(parentNode);
          this.current = parentNode;
        }
      },
    );
  }

  private readEntity() {
    assertToken(this.read(), '&');
    const sharp = !this.done && this.look() === '#' ? '#' : '';
    if (sharp) this.read();
    const name = this.readUntil(isNotAlpha).join('');
    const colon = !this.done && this.look() === ';' ? ';' : '';
    if (colon) this.read();
    // Create an element to parse html entity.
    const div = document.createElement('div');
    div.innerHTML = '&' + sharp + name + colon;
    const { textContent } = div;
    assertNotNull(textContent);
    return textContent;
  }

  private readTagName() {
    const h2 = this.look(2);
    assertDefined(h2);
    assertToken(h2[0], '<');

    const isClosing = h2[1] === '/' ? '/' : '';
    this.read(isClosing ? 2 : 1);

    // https://html.spec.whatwg.org/multipage/parsing.html#tag-name-state
    const tagName = this.readUntil('\t\n\f />\x00').join('');

    return { tagName, isClosing };
  }

  private readTag() {
    const { tagName, isClosing } = this.readTagName();

    if (this.done) {
      if (!tagName) this.current.appendChild(document.createTextNode('<' + isClosing));
      return;
    }

    const { state, attrsManager } = this.readAttributes();
    if (state === 0) return;

    const isSelfClosing = state === 2;

    if (isClosing) {
      // Find nearest matched element and close it.
      for (let i: Node | null = this.current; i instanceof Element; i = i.parentNode) {
        if (i.tagName.toUpperCase() == tagName.toUpperCase()) {
          const { parentNode } = i;
          assertNotNull(parentNode);
          this.current = parentNode;
          break;
        }
      }
    } else {
      // Create element.
      const xmlns = attrsManager.get('xmlns');
      let element;
      if (xmlns) {
        element = document.createElementNS(xmlns, tagName);
      } else {
        if (this.current instanceof Element) {
          element = document.createElementNS(this.current.namespaceURI, tagName);
        } else {
          element = document.createElement(tagName);
        }
      }

      attrsManager.bind(element);

      this.current.appendChild(element);
      this.current = element;

      // Handle self-closing tag
      if (
        (!(this.current instanceof HTMLElement) && isSelfClosing) ||
        (this.current instanceof HTMLElement && isSelfClosingTag(this.current.tagName))
      ) {
        const { parentNode } = this.current;
        assertNotNull(parentNode);
        this.current = parentNode;
      } else if (this.current instanceof HTMLElement) {
        // https://html.spec.whatwg.org/multipage/parsing.html#parsing-html-fragments
        if (rawTextTagNames.has(this.current.tagName)) {
          this.readRawData();
        } else if (rcDataTagNames.has(this.current.tagName)) {
          this.readRawData(true);
        }
      }
    }
  }

  private readComment() {
    const h2 = this.read(2);
    assertDefined(h2);
    assertToken(h2[0], '<');

    const type = h2[1];
    assertToken(type, '!', '?', '/');

    // Detect it's a standard html comment or not.
    const isStandard = type === '!' && this.look(2) === '--';
    if (isStandard) this.read(2);

    let list: SlotVar[] = [];

    if (isStandard) {
      list = this.readUntil((c) => {
        return c === '-' && this.look(3) === '-->';
      });
      this.read(3);
    } else {
      list = this.readUntil('>');
      this.read();
      if (type === '?') list.unshift('?');
    }

    let comment: Comment;
    live(
      () => vl2s(list),
      (text) => {
        if (comment) {
          comment.data = text;
        } else {
          comment = document.createComment(text);
          this.current.appendChild(comment);
        }
      },
    );
  }

  static isNotAttrSpace = (c: string) => '\x09\x0a\x0c\x20'.indexOf(c) === -1;
  private readAttrSpace() {
    return this.readUntil(HtmlBuilder.isNotAttrSpace, true).join('');
  }

  /**
   *
   */
  private readAttributes(): ReadAttributes {
    const attrsManager = new AttributesManager();
    for (let i = 0; i < 1000; i++) {
      const what = this.readAttrNameOrSpread();

      // EOF found.
      if (what === false) return { state: 0, attrsManager };

      // It's a spread attributes.
      if (what.type === 'spread') {
        attrsManager.addSpread(what.value);
        continue;
      }

      // It's a attribute name.
      const name = what.value;

      // There may be spaces after attribute name.
      this.readAttrSpace();
      if (this.done) return { state: 0, attrsManager };

      const c = this.look();

      // If it's a name=value pair.
      if (c === '=') {
        this.read();
        this.readAttrSpace();
        if (this.done) return { state: 0, attrsManager };
        const value = this.readAttrValue();
        if (name.length) attrsManager.addPair(name, value);
        continue;
      }

      // It's name only.
      if (name.length) attrsManager.addPair(name, ['']);

      // It's the end of the tag, bind attributes to element and return.
      if (c === '>') {
        this.read();
        return { state: 1, attrsManager };
      } else if (c === '/' && this.look(2) === '/>') {
        this.read(2);
        return { state: 2, attrsManager };
      }
    }

    throw RangeError('Too many attributes.');
  }

  private readAttrNameOrSpread() {
    this.readAttrSpace();
    if (this.done) return false;
    let name: any[] = [];

    // Read leading variable.
    // It may be a variable attribute name such as <meta ${'x'}="" ${'dis'}able />,
    // or spread attributes such as <meta ${{ a: 1, b: 2 }} />.
    if (!this.look()) {
      this.read();
      let lv = this.getVariable();
      if (lv === null || lv === undefined) {
        // Nothing to do.
      }
      // It's an attribute name.
      else if (isValueType(lv)) {
        name.push(lv);
      }
      // Need to check following characters.
      else {
        const space = this.readAttrSpace();
        if (this.done) return false;
        const following = this.look();
        // It's spread attributes. <meta ${obj}>, and <meta ${obj}/>, and <meta ${obj} xxx />
        // are spread attributes, but <meta ${obj} = xxx /> is not.
        if (following === '>' || following === '/' || (space && following !== '=')) {
          return { type: 'spread', value: lv } as const;
        }
        // It's an attribute name.
        else {
          name.push(lv);
        }
      }
    }

    // Read attribute name
    // https://html.spec.whatwg.org/multipage/parsing.html#attribute-name-state
    const list = this.readUntil('\t\n\f >/=');
    name = name.concat(list);

    return { type: 'name', value: name } as const;
  }

  private readAttrValue() {
    const value = [];
    const h = this.look();
    // It can only be one of single quote, or double quote, or empty string.
    const boundary = h === '"' || h === "'" ? h : '';
    if (boundary) this.read();

    if (boundary) {
      const list = this.readUntil(boundary);
      this.read();
      return list;
    } else {
      return this.readUntil('\t\r\n\f >');
    }
  }

  constructor(frags: string[] | ArrayLike<string>, vars: SlotVar[]) {
    super(frags, vars);
    this.readContent();
  }
}
