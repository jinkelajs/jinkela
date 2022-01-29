# [Jinkela](https://jinkelajs.org) · [![LICENSE](https://img.shields.io/npm/l/jinkela)](LICENSE.txt) [![codecov](https://img.shields.io/codecov/c/gh/jinkelajs/jinkela)](https://codecov.io/github/jinkelajs/jinkela?branch=v2)

THINK OF SELF AS A FRONTEND FRAMEWORK

## Usage

A typical usage example.

```javascript
import { jkl, createState } from 'jinkela';

const list = createState([]);

const click = () => {
  const remove = () => {
    const index = list.indexOf(li);
    if (index !== -1) list.splice(index, 1);
  };
  const li = jkl`
    <li>
      ${new Date()}
      <button @click="${remove}">remove</button>
    </li>`;
  list.push(li);
};

const div = jkl`
  <button @click="${click}">+1</button>
  <ul style="line-height: 1.75;">${list}</ul>`;

document.body.appendChild(div);
```

## Docs

SEE https://jinkelajs.org
