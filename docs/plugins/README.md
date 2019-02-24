## 1. Nesting

Support nesting CSS selector.

#### 1.1. Include

```html
<script src="https://jinkelajs.org/plugins/nesting.js"></script>
```

#### 1.2. Demo

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

## 2. From

Support "from" static method.

#### 2.1. Include

```html
<script src="https://jinkelajs.org/plugins/from.js"></script>
```

#### 2.2. Demo

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

## 3. Html

Support "html" tag function.

#### 3.1. Include

```html
<script src="https://jinkelajs.org/plugins/html.js"></script>
```

#### 3.2. Demo

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
