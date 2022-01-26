# 模板解析器: **jkl**

`jkl` 是一个模板字符串的标签函数，他会把模板字符串作为 HTML 解析，在其中适当的位置可以使用变量，返回一个文档片段。

```typescript
import { jkl } from 'jinkela';

const div = jkl`<div title="jinkela">Hello Jinkela</div>`;

document.body.appendChild(div);
```

## 内容 🍄

内容区域可以是变量，并且支持数据动态绑定的。

```typescript
import { jkl, createState } from 'jinkela';

const s = createState({ v: 1 });

setInterval(() => ++s.v, 16);

const div = jkl`<h1>恭喜发财 &times; ${() => s.v}</h1>`;

document.body.appendChild(div);
```

### 数组内容

内容区域支持数组

```typescript
import { jkl } from 'jinkela';

const a = ['a', 'b', 'c'];

const h1 = jkl`<h1>${a}</h1>`;

document.body.appendChild(h1);
```

## 属性

### 属性名

属性名支持变量，但是不支持动态绑定。

```typescript
import { jkl } from 'jinkela';

const a = 'disabled';
const b = 'placeholder';
const input = jkl`<input ${a} ${b}="input" />`;

document.body.appendChild(input);
```

### 属性值 🍄

属性值支持动态绑定，下面这个例子是放一个计时器不断更新 input 的 placeholder 值。

```typescript
import { jkl, createState } from 'jinkela';
const s = createState({ v: 1 });

setInterval(() => ++s.v, 16);

const input = jkl`<input placeholder="${() => s.v}" />`;

document.body.appendChild(input);
```

### 属性展开 🍄

可以将一个对象展开作为属性，并且支持动态绑定。

```typescript
import { jkl, createState } from 'jinkela';
const s = createState({
  style: 'font-size: 22px;',
  disabled: true,
  placeholder: 1,
});

setInterval(() => ++s.placeholder, 16);

const input = jkl`<input ${() => ({ ...s })} />`;

document.body.appendChild(input);
```

对于同名属性时遵循右覆盖左的规则，此规则对属性展开的用法同样适用。

```typescript
import { jkl, createState } from 'jinkela';

const input = jkl`
  <h1 style="color: red;" ${{ style: 'color: orange;' }}>
    Hello Jinkela
  </h1>`;

document.body.appendChild(input);
```

## 标签名

标签名可以是变量，但是不支持动态绑定。

```typescript
import { jkl } from 'jinkela';

for (let i = 1; i <= 6; i++) {
  const hx = jkl`<h${i}>Hello Jinkela</h${i}>`;
  document.body.appendChild(hx);
}
```

# 周边函数

## **createState** 创建状态

```typescript
const s = createState({ a: 233 });

s.a + 1;

jkl`<div>${() => s.a}</div>`;
```
