import { assertDefined, assertNotNull, assertToken, isSelfClosingTag, isValueType } from './utils';
import type { SlotVar } from './utils';
import { live } from './StateManager';
import { StringBuilder } from './StringBuilder';
import { BasicBuilder } from './BasicBuilder';
import { domListAssign } from './domListAssign';
import { IndexedArray } from './IndexedArray';
import { AttributesManager } from './AttributesManager';

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
        if (h3[1] === '!' || h3[1] === '?') {
          sb.commit();
          this.readComment();
        } else {
          const hasSlash = h3[1] === '/';
          const leading = hasSlash ? h3[2] : h3[1];
          if (leading) {
            // Tag name must start with ascii alpha characters.
            if (/[a-zA-Z]/.test(leading)) {
              sb.commit();
              this.readTag();
            }
            // It's not a html tag, may be comment or text.
            else {
              // It's a comment, if starts with slash, such as </注释>.
              if (hasSlash) {
                sb.commit();
                this.readComment();
              }
              // It's a text, such as <123>.
              else {
                // Read it as a plain text, don't commit here.
                this.read();
                sb.append(c);
              }
            }
          }
          // It's probably a variable tag, if no leading character found.
          // Anyway, read it as a tag.
          else {
            sb.commit();
            this.readTag();
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
        if (typeof variable === 'function') {
          live(variable, (value) => {
            list = domListAssign(list, value);
          });
        } else {
          list = domListAssign(list, variable);
        }
      }
      // Normal char.
      else {
        this.read();
        sb.append(c);
      }
    }
  }

  private readEntity() {
    assertToken(this.read(), '&');
    const sharp = !this.done && this.look() === '#' ? '#' : '';
    if (sharp) this.read();
    const name = this.readWhile(/[a-zA-Z0-9]/);
    const colon = !this.done && this.look() === ';' ? ';' : '';
    if (colon) this.read();
    // Create an element to parse html entity.
    const div = document.createElement('div');
    div.innerHTML = '&' + sharp + name + colon;
    const { textContent } = div;
    assertNotNull(textContent);
    return textContent;
  }

  private readTag() {
    const h2 = this.look(2);
    assertDefined(h2);
    assertToken(h2[0], '<');

    const isClosing = h2[1] === '/' ? '/' : '';
    this.read(isClosing ? 2 : 1);

    // https://html.spec.whatwg.org/multipage/parsing.html#tag-name-state
    const tagName = this.readUntil('\t\n\f />\x00', true);

    if (this.done) {
      if (!tagName) this.current.appendChild(document.createTextNode('<' + isClosing));
      return;
    }

    if (isClosing) {
      // Closing tag may have some attributes, read and ignore them.
      this.readAttributes();

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
      const element = document.createElement(tagName);

      const complete = this.readAttributes(element);
      if (!complete) return;

      this.current.appendChild(element);
      this.current = element;

      // Handle self-closing tag
      if (this.current instanceof HTMLElement && isSelfClosingTag(this.current.tagName)) {
        const { parentNode } = this.current;
        assertNotNull(parentNode);
        this.current = parentNode;
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

    const list: SlotVar[] = [];

    const sb = new StringBuilder((s) => list.push(s));
    if (type === '?') sb.append(type);

    for (;;) {
      const c = this.read();
      // Standard html comment
      if (isStandard && c === '-' && this.look(2) === '->') {
        this.read(2);
        sb.commit();
        break;
      }
      // Simple html comment.
      else if (!isStandard && c === '>') {
        sb.commit();
        break;
      }
      // Not a comment terminator, append char to string builder.
      else if (c) {
        sb.append(c);
      } else {
        sb.commit();
        list.push(this.getVariable());
      }
    }

    let comment: Comment;
    live(
      () => list.map((i) => (typeof i === 'function' ? i() : i)).join(''),
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

  private readAttrSpace() {
    // Ignore empty characters.
    return this.readWhile('\x09\x0a\x0c\x20');
  }

  private readAttributes(element?: HTMLElement) {
    const am = new AttributesManager();
    for (let i = 0; i < 1000; i++) {
      const res = this.readAttrName(element);
      if (res === false) return false;

      // It's a extract attributes.
      if (typeof res === 'object') {
        am.addExtract(res.value);
        continue;
      }

      const name = res;

      this.readAttrSpace();
      if (this.done) return false;

      const c = this.look();

      // If it's a name=value pair.
      if (c === '=') {
        this.read();
        this.readAttrSpace();
        if (this.done) return false;
        const value = this.readAttrValue();
        if (name) am.addPair(name, value);
        continue;
      }

      // It's name only.
      if (name) am.addPair(name, ['']);

      // End of tag, set last attribute and stop.
      if (c === '>') {
        this.read();
        break;
      } else if (c === '/' && this.look(2) === '/>') {
        this.read(2);
        break;
      }
    }

    if (element) am.bind(element);
    return true;
  }

  private readAttrName(element?: HTMLElement) {
    this.readAttrSpace();
    if (this.done) return false;
    let name = '';

    // Read leading variable.
    // It may be a variable attribute name such as <meta ${'x'}="" ${'dis'}able />,
    // or name-value pairs such as <meta ${'x'} />.
    if (!this.look()) {
      this.read();
      let leadingVariable = this.getVariable();
      if (leadingVariable === null || leadingVariable === undefined) {
        // Nothing to do.
      }
      // It's unknown, need to check following characters.
      else if (!isValueType(leadingVariable)) {
        const space = this.readAttrSpace();
        if (this.done) return false;
        const following = this.look();
        // It's name-value pairs.
        if (following === '>' || following === '/' || (space && following !== '=')) {
          return { type: 'extract', value: leadingVariable } as const;
        }
        // It's an attribute name.
        else {
          name += leadingVariable;
        }
      }
      // It's an attribute name.
      else {
        name += leadingVariable;
      }
    }

    // Read attribute name
    // https://html.spec.whatwg.org/multipage/parsing.html#attribute-name-state
    name += this.readUntil('\t\n\f >/=', true);
    return name;
  }

  private readAttrValue() {
    const value = [];
    const h = this.look();
    // It can only be one of single quote, or double quote, or empty string.
    const boundary = h === '"' || h === "'" ? h : '';
    if (boundary) this.read();

    if (boundary) {
      for (;;) {
        // The readUntil method may be broken by variable, try to read variable and continue.
        value.push(this.readUntil(boundary));
        // Read boundary character or variable.
        if (this.read()) return value;
        value.push(this.getVariable());
      }
    } else {
      for (;;) {
        // The readUntil method may be broken by variable, try to read variable and continue.
        value.push(this.readUntil('\t\r\n\f >'));
        // Use head() here, we needen't read tag closing charater.
        if (this.done || this.look()) return value;
        this.read();
        value.push(this.getVariable());
      }
    }
  }

  constructor(frags: string[] | ArrayLike<string>, vars: SlotVar[]) {
    super(frags, vars);
    for (;;) {
      if (this.done) break;
      this.readContent();
    }
  }
}
