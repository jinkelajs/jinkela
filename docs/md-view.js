import { jkl, createState, request } from 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-dev1/dist/index.esm.js';

const makeCodePreview = () => {
  const src = 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-dev1/dist/index.iife.js';
  Array.from(document.querySelectorAll('pre.hljs'), (pre) => {
    const code = pre.textContent.replace(/^import (.*) from 'jinkela';$/gm, `const $1 = Jinkela;`);
    const href = URL.createObjectURL(
      new Blob(
        [
          '<!DOCTYPE html>\n<html>\n<body>\n',
          `<script src="${src}"><\/script>\n`,
          `<script>\n\n${code}\n\n<\/script>\n`,
          '</body>\n</html>\n',
        ],
        { type: 'text/html' },
      ),
    );
    pre.insertBefore(jkl`<a class="try" href="${href}" target="_blank">Try</a>`, pre.firstChild);
  });
};

const de = document.documentElement;
const pageState = createState({ menuPos: 'absolute', hash: location.hash });
addEventListener('scroll', () => (pageState.menuPos = de.scrollTop > 90 ? 'fixed' : 'absolute'));
addEventListener('hashchange', () => (pageState.hash = location.hash));

const renderer = new marked.Renderer();
renderer.code = (code, lang) => {
  const validLang = !!(lang && hljs.getLanguage(lang));
  const highlighted = validLang ? hljs.highlight(lang, code).value : code;
  return `<pre class="hljs ${lang}">${highlighted}</pre>`;
};
marked.setOptions({ renderer });

/**
 * @param {string} src
 * @param {string} title
 * @returns {Node}
 */
export const mdView = (src, title) => {
  const md = request(() =>
    fetch(`${src}?_=${Date.now()}`)
      .then((r) => r.text())
      .then((text) => {
        const html = marked.parse(text);
        const node = jkl({ raw: [html] });
        return node;
      }),
  );

  return jkl`
    <main class="md-view">
      ${() => {
        if (md.loading) return jkl`<h2>Loading...</h2>`;
        return jkl`
          <aside style="position: ${() => pageState.menuPos};">
            <h2>${title}</h2>
            <ul>
              ${() => {
                if (!md.data) return;
                const list = md.data.querySelectorAll('[id]');
                return Array.from(list, (h) => {
                  const level = h.tagName.match(/\d+/) - 1;
                  const href = `#${encodeURIComponent(h.getAttribute('id'))}`;
                  const weight = () => (href === pageState.hash ? 'bold' : 'normal');
                  return jkl`
                    <li style="margin-left: ${level}em; font-weight: ${weight};">
                      <a href="${href}">${h.textContent}<a/>
                    </li>`;
                });
              }}
            </ul>
          </aside>
          <article>
            ${() => {
              if (!md.data) return null;
              setTimeout(() => {
                const id = decodeURIComponent(location.hash.slice(1));
                document.getElementById(id)?.scrollIntoView(true);
                makeCodePreview();
              });
              return md.data.cloneNode(true);
            }}
          </article>
        `;
      }} 
    </main>`;
};
