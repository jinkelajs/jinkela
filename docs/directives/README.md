## Official Directives

### 1. Ref

Use `ref` attribute on a DOM element, that will be referred as a property on the owner component.

#### 1.1. Include

```html
<script src="//yanagieiichi.github.io/jinkela/directives/ref.js"></script>
```

#### 1.2. Demo

```js
class Demo extends Jinkela {
  init() {
    this.span1.textContent = 'span1';
    this.span2.textContent = 'span2';
  }
  get template() {
    return `
      <div>
        <span ref="span1"></span>
        <hr/>
        <span ref="span2"></span>
      </div>
    `;
  }
}
```

[Live Demo](../../demo/ref-demo.html)

### 2. On-*

An event binding will be created, if the `on-${EVENT_NAME}` attribute set on a DOM element.

#### 2.1. Include

```html
<script src="//yanagieiichi.github.io/jinkela/directives/on.js"></script>
```

#### 2.2. Demo

```js
class Demo extends Jinkela {
  click() {
    alert('haha~');
  }
  get template() {
    return `
      <div>
        <input type="button" on-click="{click}" value="Click Me" />
      </div>
    `;
  }
}
```

[Live Demo](../../demo/on-demo.html)

### 3. If / If-Not

An condition watcher will be created, if the `if` or `if-not` attribute set on a DOM element.

#### 3.1. Include

```html
<script src="//yanagieiichi.github.io/jinkela/directives/if.js"></script>
```

#### 3.2. Demo

```js
class Demo extends Jinkela {
  init() {
    setInterval(() => {
      this.condition ^= 1;
    }, 200);
  }
  get template() {
    return `
      <div>
        <div if="{condition}">A</div>
        <div if-not="{condition}">B</div>
      </div>
    `;
  }
}
```

[Live Demo](../../demo/if-demo.html)

### 4. JKL-*

Initialize a component with custom html tag.

#### 4.1. Include

```html
<script src="//yanagieiichi.github.io/jinkela/directives/jkl.js"></script>
```

#### 4.2. Demo

```js
class Foo extends Jinkela {
  init() {
    this.element.style.color = this.color;
  }
  get template() { return `<span><meta ref="children" />: <span>{text}</span></span>`; }
}

class Fee extends Jinkela {
  get text() { return 0; }
  get template() {
    return `
      <div>
        <jkl-foo ref="foo" color="red" text="{text}">counter</jkl-foo>
      </div>
    `;
  }
}

let fee = new Fee().renderTo(document.body);
console.log(fee.foo instanceof Foo);
setInterval(() => {
  fee.text = +fee.text + 1;
}, 16);
```

[Live Demo](../../demo/jkl-demo.html)

## Custom Directives

#### Jinkela.register(...)

You can hook component building handler to create your custom directive.

```js
Jinkela.register({ pattern, priority, handler });
```

| Parameter Name   | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| `pattern`        | A RegExp object, to match node name.                                 |
| `priority`       | The priority of directive.                                           |
| `handler`        | Handler function will be executed on node matched.                   |

About the `handler` function:

```js
let handler = (ownerComponent, matchedNode, ownerElement) => {
  // TODO
  let receiver = matchedNode => {
    // TODO
    matchedNode.jinkelaValue;
  };
  matchedNode['@@subscribers'].push(reciver);
};
```

| Arguments           | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| 0: `ownerComponent` | Owner component.                                                     |
| 1: `matchedNode`    | Matched node (may be any type of node).                              |
| 2: `ownerElement`   | Owner element of the matched node (may be itself).                   |

#### Demo

```js
Jinkela.register({
  pattern: /^X-FOO$/,
  priority: 100,
  handler: (ownerComponent, node, ownerElement) => {
    node.style.color = 'red';
  }
});

Jinkela.register({
  pattern: /^data-tip$/,
  priority: 200,
  handler: (ownerComponent, node, ownerElement) => {
    ownerElement.addEventListener('click', () => {
      alert(ownerElement.getAttribute('data-tip'));
    });
  }
});

class Demo extends Jinkela {
  get template() {
    return `
      <div data-tip="i am a tip">
        <x-foo>i am red, click me plz.</x-foo>
      </div>
    `;
  }
}
```

[Live Demo](../../demo/custom-directive-demo.html)
