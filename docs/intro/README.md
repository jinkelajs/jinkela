## The Jinkela

Jinkela is a modularization solution of frontend.

## Getting Started

### 1. My First Jinkela Component

```js
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

new MyFirstComponent({ text: 'Jinkela' }).renderTo(document.body);
```

<a href="my-first-jinkela-component.html">Live Demo</a>

### 2. Component Extending

```js
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

new MyUnderline({ text: 'Jinkela Bold' }).renderTo(document.body);
new MyBig({ text: 'Jinkela Big' }).renderTo(document.body);
```

<a href="component-extending.html">Live Demo</a>

### 3. Init Component

```js
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

new MyCounter({ name: 'Counter', from: 10086 }).renderTo(document.body);
```

<a href="init-component.html">Live Demo</a>

### 4. Add Event Listener

```js
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
  }).renderTo(document.body);
  return input;
});
```

<a href="add-event-listener.html">Live Demo</a>

## Component Running Steps

When a Jinkela class is operated with `new`, The following steps are taken:

#### 1. Parepare

##### 1.1. Execute `beforeParse` Handler

#### 2. Build DOM

##### 2.1. Build Element

Read HTML tempalte from `template` or `tagName` properties, and build to a html element as `element` property.

##### 2.2. Build Style

Read and merge all `styleSheet` form prototype chains.

#### 3. Copy Properties

##### 3.1. Execute `beforeExtends` Handler

##### 3.2. Extend Params

Copy each properties of each parameters to instance.

#### 4. Execute `init`

Execute `init` method of instance (auto super with whole prototype chains).

## Internal Properties

| Property Name | Description                                           |
| ------------- | ----------------------------------------------------  |
| template      | The HTML tempalte of component.                       |
| tagName       | The tagName of component.                             |
| styleSheet    | The styleSheet of component.                          |
| element       | Raw DOM element of component.                         |
| init          | The initializing function of component.               |
| renderTo      | Append element of this component to a parent element. |
