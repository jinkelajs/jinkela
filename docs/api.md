# 模板解析器: **jkl**

`jkl` 是一个模板字符串的标签函数，他会把模板字符串作为 HTML 解析，在其中适当的位置可以使用变量，返回一个文档片段。

```typescript
import { jkl } from 'jinkela';

const div = jkl`<div title="jinkela">Hello Jinkela</div>`;

document.body.appendChild(div);
```

## 内容

### 变量绑定

内容区域可以是变量，并且支持数据动态绑定的。

```typescript
import { jkl, createState } from 'jinkela';

const s = createState({ v: 1 });

setInterval(() => ++s.v, 16);

const div = jkl`<h1>恭喜发财 &times; ${() => s.v}</h1>`;

document.body.appendChild(div);
```

### 数组绑定

内容区域支持数组，并且支持数据动态绑定的。

```typescript
import { jkl, createState } from 'jinkela';

const list = createState([1, 2, 3, 4, 5].map((i) => jkl`<li>${i}</li>`));

setInterval(() => {
  list.unshift(list.pop());
}, 300);

const h1 = jkl`<ul>${list}</ul>`;

document.body.appendChild(h1);
```

## 属性

### 属性名

属性名支持变量。在下面这个例子中打开控制台把 s.v 改成其他值，input 就会恢复可编辑状态。

```typescript
import { jkl, createState } from 'jinkela';

const s = createState({ v: 'disabled' });
const b = 'placeholder';
const input = jkl`<input ${() => s.v} ${b}="input" />`;

document.body.appendChild(input);
```

### 属性值

属性值支持动态绑定。下面这个例子是让一个元素的颜色不断变化。

```typescript
import { jkl, createState } from 'jinkela';

const s = createState({ v: 1 });

const anime = () => {
  s.v += 2;
  requestAnimationFrame(anime);
};
anime();

const input = jkl`
  <h1 style="color: hsl(${() => s.v},50%,50%)">Hello Jinkela</h1>`;

document.body.appendChild(input);
```

### 属性展开

可以将一个对象展开作为属性，并且支持动态绑定。

```typescript
import { jkl, createState } from 'jinkela';

const attrs = createState({
  style: 'font-size: 22px;',
  disabled: true,
  placeholder: 1,
});

setInterval(() => ++attrs.placeholder, 16);

const input = jkl`<input ${attrs} />`;

document.body.appendChild(input);
```

对于同名属性时遵循右覆盖左的规则，此规则对属性展开的用法同样适用。

```typescript
import { jkl, createState } from 'jinkela';

const input = jkl`
  <h1 style="color: red;" ${{ style: 'color: orange;' }}>
    Orange Jinkela
  </h1>`;

document.body.appendChild(input);
```

## 事件绑定

### 基础事件绑定

在属性名前面加 `@` 将处理为事件绑定。下面这个例子是在按钮上绑定点击事件，点击后往 ul 中增加一项。

```typescript
import { jkl, createState } from 'jinkela';

const list = createState([]);

const click = () => {
  list.push(jkl`<li>${Date.now()}</li>`);
};

const input = jkl`
  <button @click="${click}">+1</button>
  <hr/>
  <ul>${list}</ul>
`;

document.body.appendChild(input);
```

### 动态事件绑定

通过属性展开的写法可以让事件支持动态绑定。下面这个例子默认不会对按钮绑定事件，只有勾起 checkbox 之后才会绑定事件。

```typescript
import { jkl, createState } from 'jinkela';

const attrs = createState({});
const list = createState([]);

const change = (e) => {
  if (e.target.checked) {
    attrs.style = 'color: red;';
    attrs['@click'] = () => {
      list.push(jkl`<li>${Date.now()}</li>`);
    };
  } else {
    delete attrs.style;
    delete attrs['@click'];
  }
};

const input = jkl`
  <div>
    <input type="checkbox" @change="${change}" />
    <button ${attrs}>+1</button>
  </div>
  <ul>${list}</ul>
`;

document.body.appendChild(input);
```

# 周边函数

## **createState**

### 创建状态

使用 `createState` 可以给一个对象包一层 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)，当对象属性变化时会通知所有订阅该属性变化的地方更新。

```typescript
import { jkl, createState } from 'jinkela';

const s = createState({ a: 233 });

document.body.appendChild(jkl`<div>${() => s.a}</div>`);
```

### 创建数组状态

可以对一个数组创建状态，在修改数组元素时触发更新。包括 push、pop 之类的操作，本质上都是在操作数据元素，所以也能触发更新。

```typescript
import { jkl, createState } from 'jinkela';

const list = createState([]);

list.push(jkl`<div>hehe</div>`);

document.body.appendChild(jkl`<div>${list}</div>`);
```

# 内置工具库

## request

将一个异步任务转换成具有 { loading, data, error } 结构的状态。

```typescript
import { jkl, request } from 'jinkela';

const sleep = (ms) => new Promise((f) => setTimeout(f, ms));

const s = request(async () => {
  await sleep(1000);
  return 'I am data';
});

document.body.appendChild(jkl`
  <div>loading: ${() => s.loading}</div>
  <div>data: ${() => s.data}</div>
  <div>error: ${() => s.error}</div>
`);
```
