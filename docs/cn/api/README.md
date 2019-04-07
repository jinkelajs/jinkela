## 核心

### 成员方法

#### .to(target)

用于将组件渲染到目标元素上。

target 可以是一个 Jinkela 实例，也可以是一个 DOM 对象。

```html
<script src="../jinkela.js"></script>
<body>
<span>Hello</span>
<script>
class Demo extends Jinkela {
  get template() {
    return '<span>World</span>';
  }
}

new Demo().to(document.body);
</script>
```

[在线示例](../../../demo/to.html)

#### .prependTo(target)

用于将组件渲染到目标元素上，并且作为第一个子元素。

target 可以是一个 Jinkela 实例，也可以是一个 DOM 对象。

```html
<script src="../jinkela.js"></script>
<body>
<span> World</span>
<script>
class Demo extends Jinkela {
  get template() {
    return '<span>Hello</span>';
  }
}

new Demo().prependTo(document.body);
</script>
```

[在线示例](../../../demo/prepend-to.html)

### 成员属性

#### .element

用于访问 Jinkela 实例对应的 DOM 元素。

```html
<script src="../jinkela.js"></script>
<body>
<script>
class Demo extends Jinkela {}
let demo = new Demo().to(document.body);
demo.element.textContent = 'Hello World';
</script>
```

[在线示例](../../../demo/element.html)

### 生命周期钩子

#### beforeParse

`new` 时触发，用于组件解析前的参数预处理。

```js
class Foo extends Jinkela {
  get template() {
    return `
      <ul>
        <li>a: <var>{a}</var></li>
        <li>b: <var>{b}</var></li>
        <li>c: <var>{c}</var></li>
      </ul>
    `;
  }
  beforeParse(params) {
    // 可以计算一个新的值 
    params.c = params.a + params.b;
    // 也可以删除上面的参数（不影响原始数据）
    delete params.a;
  }
}

let foo = new Foo({ a: 1, b: 2 }).to(document.body);
```

[在线示例](../../../demo/before-parse.html)

#### init

DOM 初始化完毕（但未渲染到文档）时触发，业务逻辑都放在这里开始执行。

```js
class Foo extends Jinkela {
  init() {
    // 此时可以操作 DOM
    this.element.textContent = 'Hello World';
  }
}

new Foo().to(document.body);
```

[在线示例](../../../demo/init.html)

#### 缺陷

Jinkela 暂时没有 mounted 和 destroyed 钩子，这是因为原生 DOM 目前无法提供一套**成熟**的 API 来做这件事（<a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver" target="_blank">MutationObserver</a> 还不够成熟）。Jinkela 作为一个可以稳定用于生产环境的框架，不会依赖不成熟的特性。

## 指令

### 位置引用：ref

在 DOM 上使用 `ref` 属性来引用一个 DOM 对象或 Jinkela 组件。

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

[在线示例](../../../demo/ref-demo.html)

同时，`ref` 引用还可以被赋值，行为是使用新的元素或组件去替换现有的内容。

```js
class Item extends Jinkela {
  get template() {
    return `
      <li>{text}</li>
    `;
  }
}

class Demo extends Jinkela {
  init() {
    this.list = [
      new Item({ text: 'one' }),
      new Item({ text: 'two' }),
      new Item({ text: 'three' })
    ];
  }
  get template() {
    return `
      <ul>
        <meta ref="list" />
      </ul>
    `;
  }
}
```

[在线示例](../../../demo/ref-demo-2.html)

### 事件绑定：on-*

在 DOM 元素上添加 `on-${EVENT_NAME}` 属性来绑定事件：

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

[在线示例](../../../demo/on-demo.html)

### 条件：if / if-not

`if` / `if-not` 属性通过绑定一个数据来决定目标元素是否渲染到 DOM 树。

**注意：只影响是否渲染到 DOM 树，不影响组件的初始化**

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

[在线示例](../../../demo/if-demo.html)

### 组件标签化：JKL-*

使用自定义元素来初始化 Jinkela 组件。

```js
class Foo extends Jinkela {
  init() {
    this.element.style.color = this.color;
  }
  get template() {
    return `
      <span>
        <meta ref="children" />: <span>{text}</span>
      </span>
    `;
  }
}

class Demo extends Jinkela {
  get text() { return 0; }
  init() {
    setInterval(() => {
      this.text++;
    }, 16);
  }
  get template() {
    return `
      <div>
        <jkl-foo ref="foo" color="red" text="{text}">counter</jkl-foo>
      </div>
    `;
  }
}
```

[在线示例](../../../demo/jkl-demo.html)

### 自定义指令 Jinkela.register(...)

使用 `Jinkela.register` 可以注册一个自定义指令。

```js
Jinkela.register({ pattern, priority, handler });
```

| 参数名           | 描述                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `pattern`        | 用于匹配节点名的正则表达式对象。                                     |
| `priority`       | 指令的优先级。                                                       |
| `handler`        | 当匹配到节点时执行的处理函数。                                       |

`handler` 处理函数的参数以及返回值：

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

| 参数                | 描述                                                                 |
| ------------------- | -------------------------------------------------------------------- |
| 0: `ownerComponent` | 匹配到的组件。                                                       |
| 1: `matchedNode`    | 匹配到的节点（可能是元素节点或属性节点）                             |
| 2: `ownerElement`   | 匹配到的节点所属的元素（如果匹配到元素节点则是它自己）               |

**示例**

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

[在线示例](../../../demo/custom-directive-demo.html)

## 插件

### 1. CSS 嵌套

原生 CSS 是不支持嵌套语法的，这样代码写起来会非常难受。

CSS 嵌套插件使得在 `styleSheet` 中可以写嵌套的语法。

**单独引入**

```html
<script src="https://jinkelajs.org/plugins/nesting.js"></script>
```

**示例**

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

[在线示例](../../../demo/nesting-demo.html)

### 2. Jinkela.from

提供 `Jinkela.from` 静态方法，类似 `Array.from`，可以将原始数据快速包装成一组 Jinkela 对象。

**单独引入**

```html
<script src="https://jinkelajs.org/plugins/from.js"></script>
```

**示例**

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

[在线示例](../../../demo/from-demo.html)

### 3. Jinkela.html

提供 `Jinkela.html` 字符串模板标签函数，用于快速初始化一个 Jinkela 实例（在懒得写一个类再去实例化的情况下非常有用）。

**单独引入**

```html
<script src="https://jinkelajs.org/plugins/html.js"></script>
```

**示例**

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

[在线示例](../../../demo/html-demo.html)
