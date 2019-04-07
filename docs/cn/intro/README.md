## Jinkela 是什么？

Jinkela（金坷垃）<del style="opacity:.3;">是一种肥料添加剂</del> 自认为是一个**前端框架**。

其核心思想是：**尽可能地使用规范内的特性，让代码无需构建就能在浏览器上跑起来**。

适合用来快速搭建一个小而轻的工具类页面，适合交互密集型的组件开发，不适合大型多人协作的项目。目前 Jinkela 已经是一个相对稳定的版本，可以在生产环境使用。

## 快速上手

### 1. 第一个金坷垃组件

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

[在线示例](../../../demo/my-first-jinkela-component.html)

### 2. 组件的继承

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

[在线示例](../../../demo/component-extending.html)

### 3. 组件初始化动作

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

[在线示例](../../../demo/init-component.html)

### 4. 事件绑定

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

[在线示例](../../../demo/add-event-listener.html)

## 深入了解组件

当一个 Jinkela 类被 `new` 时，将执行以下过程：

#### 1. 准备阶段

##### 1.1. 初始化 `element` 属性

Jinkela 会读取实例上的 `template` 或 `tagName` 属性（默认是 DIV）来初始化元素。

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

[在线示例](../../../demo/element.html)

##### 1.2. 执行 `beforeParse` 处理函数

透传 `new` 的参数到 `beforeParse`，这个阶段是为了在数据绑定之前对数据的一些预处理。

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

[在线示例](../../../demo/before-parse.html)

#### 2. 解析

##### 2.1. 初始化 CSS

将原型链上的所有 `styleSheet` 属性读取并合并起来，作为这个实例的样式。

##### 2.2. 数据绑定、初始化指令

以 DLR 方式遍历组件的 DOM 树，对内容为 `\{\w+\}` 的文本或属性节点设置数据绑定。

```javascript
class Foo extends Jinkela {
  get template() {
    return `<div><span>{first}</span>,<span>{second}</span></div>`;
  }
}
let foo = new Foo({ first: 1 });
console.log(foo.element.textContent === '1,undefined'); // true
```

[在线示例](../../../demo/undefined-binding.html)

如果数据绑定的属性名本身就是一组访问器属性，那么 getter 的结果将作为默认值，setter 将作为变化通知（类似 watch）。

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

[在线示例](../../../demo/accessor-binding.html)

##### 2.3. 数据初始赋值

将 `new` 时传入的参数依次赋值到实例上。

#### 3. 执行 `init` 处理函数

这个阶段表示 DOM 已经初始化完毕（但是还没渲染到文档），业务逻辑主要在这个阶段开始。

另外，`init` 处理函数有个特殊之处是会自动执行 `super.init()`，原型链上的 `init` 处理函数都会被执行一遍。

