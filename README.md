## Jinkela

A Modularization Solution of Front-End 

#### Usage

```js
class MyComponent extends Jinkela {
  onInput({ target }) { this.value = target.value; }
  get styleSheet() {
    return `
      :scope {
        h1 { color: red; }
        span { color: blue; }
        input {
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 5px;
          width: 200px;
          background: #f5f5f5;
          padding: .25em;
        }
        input:focus {
          outline: 0;
          border: 1px solid #0c0;
          background: #f5fff5;
        }
      }
    `;
  }
  get template() {
    return `
      <div>
        <h1>Hello <span>{value}</span></h1>
        <input value="{value}" on-input="{onInput}" />
      </div>
    `;
  }
}
```

```js
addEventListener('DOMContentLoaded', () => {
  new MyComponent({ value: 'Jinkela' }).renderTo(document.body);
});
```

<a href="https://yanagieiichi.github.io/jinkela/demo.html" target="_blank">Live Demo</a>
