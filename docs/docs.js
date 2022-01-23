import { jkl } from 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-dev1/dist/index.esm.js';
import { header } from './header.js';
import { mdView } from './md-view.js';

const content = jkl`
  <div class="docs">
    ${header()}
    ${mdView('./intro.md', '介绍')}
  </div>`;

document.body.appendChild(content);
