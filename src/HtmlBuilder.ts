import { assertDefined, assertNotNull, assertToken, isSelfClosingTag } from './utils';
import { live } from './StateManager';
import { StringBuilder } from './StringBuilder';
import { BasicBuilder } from './BasicBuilder';
import { LiveStringBuilder } from './LiveStringBuilder';
import { domListAssign } from './domListAssign';
import { IndexedArray } from './IndexedArray';

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

    const lsb = new LiveStringBuilder();

    const sb = new StringBuilder((s) => lsb.append(s));
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
        lsb.append(this.getVariable());
      }
    }

    const comment = document.createComment(lsb.getValue());
    this.current.appendChild(comment);
    lsb.watch((text) => {
      comment.data = text;
    });
  }

  private readAttrSpace() {
    // Ignore empty characters.
    return this.readWhile('\x09\x0a\x0c\x20');
  }

  private readAttributes(element?: HTMLElement) {
    for (let i = 0; i < 1000; i++) {
      this.readAttrSpace();

      // Detect it's an event binding or not.
      if (this.done) return false;
      const isEventBinding = this.look() === '@';
      if (isEventBinding) this.read();

      let name = '';

      if (this.done) return false;
      if (!this.look()) {
        this.read();
        let leadingVariable = this.getVariable();
        const space = this.readAttrSpace();
        if (this.done) return false;
        // Extract variable to the attributes.
        if (this.look() === '>' || this.look() === '/' || (space && this.look() !== '=')) {
          if (leadingVariable) {
            const entries = Object.entries(leadingVariable);
            if (element)
              for (let i = 0; i < entries.length; i++) {
                const v = entries[i][1];
                if (v === undefined || v === null) continue;
                element.setAttribute(entries[i][0], v);
              }
          }
        } else {
          name += leadingVariable;
        }
      }

      // Read attribute name
      // https://html.spec.whatwg.org/multipage/parsing.html#attribute-name-state
      name += this.readUntil('\t\n\f >/=', true);

      this.readAttrSpace();

      if (this.done) return false;
      const c = this.look();
      // If it's a key=value pattern.
      if (c === '=') {
        this.read();
        this.readAttrSpace();
        if (this.done) return false;
        const value = this.readAttrValue();
        if (!element) continue;
        // For event binding, add all function values as the event listeners.
        if (isEventBinding) {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] !== 'function') continue;
            element.addEventListener(name, value[i] as any);
          }
        }
        // Else it's a normal attribute, bind to variable.
        else if (name) {
          const lsb = new LiveStringBuilder(value);
          lsb.live((text) => element.setAttribute(name, text));
        }
      }
      // End of tag, set last attribute and stop.
      else if (c === '>') {
        this.read();
        if (name && element) element.setAttribute(name, '');
        return true;
      } else if (c === '/' && this.look(2) === '/>') {
        this.read(2);
        if (name && element) element.setAttribute(name, '');
        return true;
      }
      // Name found only, set it without value, and find next attribute.
      else {
        if (name && element) element.setAttribute(name, '');
      }
    }
    throw new TypeError('Too many attributes.');
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

export type Var = number | string | boolean | null | undefined | Node;

export type VarOrList = Var | Var[];

export type SlotVar = VarOrList | (() => VarOrList) | ((e?: Event) => void);
