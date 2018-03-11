## The Jinkela

Jinkela is a modularization solution of frontend.

## Getting Started

### 1. My First Jinkela Component

```javascript
class MyFirstComponent extends Jinkela {
  get template() {
    return `<div>{text}</div>`;
  }
  get styleSheet() {
    return `
      :scope {
        color: red;
      }
    `;
  }
}

new MyFirstComponent({ text: 'Jinkela' }).to(document.body);
```

[Live Demo](../../demo/my-first-jinkela-component.html)

### 2. Component Extending

```javascript
class MyUnderline extends MyFirstComponent {
  get styleSheet() {
    return `
      :scope {
        text-decoration: underline;
      }
    `;
  }
}

class MyBig extends MyFirstComponent {
  get styleSheet() {
    return `
      :scope {
        font-size: 24px;
      }
    `;
  }
}

new MyUnderline({ text: 'Jinkela Bold' }).to(document.body);
new MyBig({ text: 'Jinkela Big' }).to(document.body);
```

[Live Demo](../../demo/component-extending.html)

### 3. Init Component

```javascript
class MyCounter extends Jinkela {
  init() {
    this.value = this.from || 0;
    setInterval(() => {
      this.value++;
    }, 16);
  }
  get template() {
    return `
      <div><span>{name}</span>: <span>{value}</span></div>
    `;
  }
}

new MyCounter({ name: 'Counter', from: 10086 }).to(document.body);
```

[Live Demo](../../demo/init-component.html)

### 4. Add Event Listener

```javascript
class TextField extends Jinkela {
  get styleSheet() {
    return `
      :scope { border: 1px solid #ccc; margin: .5em; padding: .2em .3em; }
    `;
  }
  get template() { return '<input type="text" />'; }
  get value() { return this.element.value; }
  set value(value) { return this.element.value = value; }
  init() {
    this.element.addEventListener('input', () => this.onInput && this.onInput());
  }
}

let inputs = Array.from({ length: 100 }, () => {
  let input = new TextField({
    onInput() {
      inputs.forEach(i => {
        if (i !== input) i.value = input.value;
      });
    }
  }).to(document.body);
  return input;
});
```

[Live Demo](../../demo/add-event-listener.html)

## Component Running Steps

When a Jinkela class is operated with `new`, The following steps are taken:

#### 1. Parepare

##### 1.1. Setup getter `element` property

That reads HTML tempalte from `template` or `tagName` properties, defaults empty DIV element.

```javascript
class A extends Jinkela {
  get template() { return '<div>Hello</div>'; }
}
let a = new A();
// From `template`
console.log(a.element.outerHTML === '<div>Hello</div>'); // true

class B extends Jinkela {
  get tagName() { return 'span'; }
}
let b = new B();
// From `tagName`
console.log(b.element.outerHTML === '<span></span>'); // true

class C extends Jinkela {
  get template() { return '<div>Hello</div>'; }
  get tagName() { return 'span'; }
}
let c = new C();
// From `template`, `tagName` will be ignored
console.log(c.element.outerHTML === '<div>Hello</div>'); // true

class D extends Jinkela {}
let d = new D();
// Defaults emtpy DIV
console.log(d.element.outerHTML === '<div></div>'); // true
```

[Live Demo](../../demo/element.html)

##### 1.2. Execute `beforeParse` Handler

Pass squashed `args` as the first argument.

```javascript
class Foo extends Jinkela {
  get template() {
    return `<div>{c}</div>`;
  }
  beforeParse(params) {
    // Now, the `params` is { a: 1, b: 2 }

    // You can insert new variable into `params`
    params.c = params.a + params.b;

    // Also deletable
    delete params.a;

    // Data has not bound yet now
    console.log(this.element.innerHTML === '{c}'); // true
  }
}

let foo = new Foo({ a: 1 }, { b: 2 });

console.log(foo.a === undefined); // true
console.log(foo.b === 2); // true
console.log(foo.c === 3); // true

// Now, data has bound
console.log(foo.element.innerHTML === '3'); // true
```

[Live Demo](../../demo/before-parse.html)

#### 2. Parse

##### 2.1. Build Style

Read and merge all `styleSheet` form prototype chains.

##### 2.2. Setup data binding

Traverse and setup data binding with DLR for DOM tree, set `undefined` if binding data not found.

```javascript
class Foo extends Jinkela {
  get template() {
    return `<div><span>{first}</span>,<span>{second}</span></div>`;
  }
}
let foo = new Foo({ first: 1 });
console.log(foo.element.textContent === '1,undefined'); // true
```

[Live Demo](../../demo/undefined-binding.html)

If both accessor property and data binding are existed, the getter is the default value of binding, and the setter is watching handler.

```javascript
class Foo extends Jinkela {
  get text() { return 'Default Text'; }
  set text(value) {
    console.log(value); // 'New Text'
  }
  get template() {
    return `<div>{text}</div>`;
  }
}
let foo = new Foo();

// The geeter property is default value of binding
console.log(foo.element.textContent === 'Default Text'); // true

// The setter property is watching handler
foo.text = 'New Text';
console.log(foo.element.textContent === 'New Text'); // true
```

[Live Demo](../../demo/accessor-binding.html)

##### 2.3. Extend Params

Copy each parameters to the instance.

#### 3. Execute `init`

Execute `init` method of instance (auto super with whole prototype chains).

## Instance Methods

### to(target)

Render the instance as last child of target (equals `target.appendChild(this)`).

The `target` is an instance of Jinkela or Element.

### prependTo(target)

Render the instance as first child of target.

The `target` is an instance of Jinkela or Element.
