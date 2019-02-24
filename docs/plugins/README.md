## Nesting

Support nesting CSS selector.

#### Include

```html
<script src="http://jinkelajs.org/plugins/nesting.js"></script>
```

#### Demo

```js
class Demo extends Jinkela {
  get template() {
    return `
      <div> [ <span>hehe</span> ] </div>
    `;
  }
  get styleSheet() {
    return `
      :scope {
        color: green;
        span {
          color: red;
        }
        &::before {
          color: blue;
          content: 'before';
        }
        &::after {
          color: orange;
          content: 'after';
        }
      }
    `;
  }
}
```

[Live Demo](../../demo/nesting-demo.html)

## From

Support "from" static method.

#### Include

```html
<script src="http://jinkelajs.org/plugins/from.js"></script>
```

#### Demo

```js
class Item extends Jinkela {
  get template() {
    return `
      <li>{text}</li>
    `;
  }
}

class List extends Jinkela {
  init() {
    Item.from(this.data).to(this);
  }
  get tagName() { return 'ol'; }
}

let data = [
  { text: 'item1' },
  { text: 'item2' },
  { text: 'item3' }
];

new List({ data }).to(document.body);
```

[Live Demo](../../demo/from-demo.html)

## Html

Support "html" tag function.

#### Include

```html
<script src="http://jinkelajs.org/plugins/html.js"></script>
```

#### Demo

```js
let obj = Jinkela.html`
  <strong>Hello</strong>
  <strong>{name}</strong>
  <hr/>
  <time>{now}</time>
  <style>
  :scope time { color: red; }
  </style>
`;

obj.name = 'Jinkela';
obj.to(document.body);

void function callee() {
  obj.now = new Date().toLocaleString();
  setTimeout(callee, 1000);
}();
```

[Live Demo](../../demo/html-demo.html)
