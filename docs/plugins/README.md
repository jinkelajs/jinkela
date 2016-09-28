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
