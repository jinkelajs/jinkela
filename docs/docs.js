import { header } from './header.js';
import { mdView } from './md-view.js';

const { jkl } = Jinkela;

const url = new URL(location.href);
const d = url.searchParams.get('d');

const docs = {
  intro: ['./intro.md', '介绍'],
  api: ['./api.md', 'API'],
};

if (!d) {
  url.searchParams.set('d', 'intro');
  location.assign(url);
} else {
  const mvArgs = docs[d];
  const content = jkl`
    <div class="docs">
      ${header()}
      ${() => {
        if (mvArgs) return mdView(...mvArgs);
        return jkl`<h2 style="margin-left: var(--side-padding); color: darkred;">Document '${d}' not found.</h2>`;
      }}
    </div>`;
  document.body.appendChild(content);
}
