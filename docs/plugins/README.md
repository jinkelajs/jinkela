## Nesting

Support nesting CSS selector.

#### Include

```html
<script src="//yanagieiichi.github.io/jinkela/plugins/nesting.js"></script>
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

[Live Demo](nesting-demo.html)

## From

Support "from" static method.

#### Include

```html
<script src="//yanagieiichi.github.io/jinkela/plugins/static.js"></script>
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
    Item.from(this.data).renderTo(this);
  }
  get tagName() { return 'ol'; }
}

let data = [
  { text: 'item1' },
  { text: 'item2' },
  { text: 'item3' }
];

new List({ data }).renderTo(document.body);
```

[Live Demo](from-demo.html)
