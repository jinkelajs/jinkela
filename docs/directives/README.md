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

[Live Demo](ref-demo.html)

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

[Live Demo](on-demo.html)

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

[Live Demo](if-demo.html)

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
  get template() { return `<span>{text}</span>`; }
}

class Fee extends Jinkela {
  get text() { return 0; }
  get template() {
    return `
      <div>
        <jkl-foo ref="foo" color="red" text="{text}"></jkl-foo>
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

[Live Demo](jkl-demo.html)

### 5. SLOT

To refer the jkl children on child component.

#### 5.1. Include

```html
<script src="//yanagieiichi.github.io/jinkela/directives/slot.js"></script>
```

#### 5.2. Demo

```js
class Foo extends Jinkela {
  get template() {
    return `
      <div>
        <slot name="before"></slot>
        <ul>
          <slot></slot>
        </ul>
        <slot name="after"></slot>
      </div>
    `;
  }
}

class Fee extends Jinkela {
  get template() {
    return `
      <div>
        <jkl-foo>
          <div slot="before">before</div>
          <li>a</li>
          <li>b</li>
          <li>c</li>
          <div slot="after">after</div>
        </jkl-foo>
      </div>
    `;
  }
}

new Fee().to(document.body);
```

[Live Demo](jkl-slot.html)


## Custom Directives

You can hook component building handler to create your custom directive.

```js
let handler = (ownerComponent, node, ownerElement) => {
  // TODO
  let receiver = value => {
    // TODO
  };
  return receiver;
};

Jinkela.register(matcher, handler);
```

| Parameter Name | Description                                                          |
| -------------  | -------------------------------------------------------------------- |
| matcher        | Node matcher, it's RegExp or String.                                 |
| handler        | Handler function will be executed on node matched. If a reciver funciton is returned, it will create a property binding to watch the value change. |
| ownerComponent | Owner component.                                                     |
| node           | Matched node (may be attribute node or element node).                |
| ownerElement   | Owner element of attribute node.                                     |
| receiver       | Receiver function will be executed on binding property assigned.     |
| value          | Changed value.                                                       |

#### Custom Directive Demo

```js
Jinkela.register('X-FOO', (ownerComponent, node, ownerElement) => {
  node.style.color = 'red';
});

Jinkela.register('data-tip', (ownerComponent, node, ownerElement) => {
  node.addEventListener('click', () => {
    alert(node.getAttribute('data-tip'));
  });
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

[Live Demo](custom-directive-demo.html)
