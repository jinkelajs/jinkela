const { jkl, createState, request } = Jinkela;

const tipOnMouse = (e) => {
  const ae = (e) => e.target.remove();
  const tip = jkl`
    <div class="md-view__tip-on-mouse" style="top: ${e.clientY}px; left: ${e.clientX}px;" @animationend="${ae}">
      Copied!
    </div>`;
  document.body.appendChild(tip);
};

const makeCodePreview = () => {
  const src = 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-beta/dist/index.iife.js';
  Array.from(document.querySelectorAll('pre.hljs'), (pre) => {
    if (pre.dataset.ext === 'copy') {
      const click = (e) => {
        const selection = getSelection();
        const { rangeCount } = selection;
        const ranges = Array.from({ length: rangeCount }, (_, i) => selection.getRangeAt(i));
        getSelection().selectAllChildren(pre.firstElementChild);
        document.execCommand('copy');
        selection.removeAllRanges();
        ranges.forEach((i) => selection.addRange(i));
        tipOnMouse(e);
      };
      pre.appendChild(jkl`<span role="button" class="copy" @click="${click}">Copy</span>`);
    } else {
      const code = pre.textContent.replace(/^import (.*) from 'jinkela';$/gm, `const $1 = Jinkela;`);
      const href = URL.createObjectURL(
        new Blob(
          [
            [
              '<!DOCTYPE html>',
              '<html>',
              '<body>',
              '<meta name="viewport" content="width=device-width, initial-scale=1" />',
              '<meta charset="utf-8" />',
              `<script src="${src}"><\/script>`,
              '<script>',
              code,
              '</script>',
              '</body>',
              '</html>',
            ].join('\n'),
          ],
          { type: 'text/html' },
        ),
      );
      pre.appendChild(jkl`<a role="button" class="try" href="${href}" target="_blank">Try</a>`);
    }
  });
};

const de = document.documentElement;
const pageState = createState({ menuPos: 'absolute', hash: location.hash });
addEventListener('scroll', () => (pageState.menuPos = de.scrollTop > 90 ? 'fixed' : 'absolute'));
addEventListener('hashchange', () => (pageState.hash = location.hash));

const renderer = new marked.Renderer();
renderer.code = (code, rLang) => {
  const [lang, ext = ''] = rLang.split(/,/g);
  const language = hljs.getLanguage(lang) ? lang : 'text';
  const { value } = hljs.highlight(code, { language });
  return `<pre class="hljs ${lang}" data-ext="${ext}"><div>${value}</div></pre>`;
};
renderer.link = (href, title, text) => {
  return `<a href="${href}" target="_blank" title="${title}">${text}</a>`;
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
      .then((r) => {
        if (r.ok) return r.text();
        throw new Error(`HTTP ${r.status}`);
      })
      .then((text) => {
        const html = marked.parse(text);
        const node = jkl({ raw: [html] });
        return node;
      }),
  );

  const s = createState({});

  addEventListener(
    'scroll',
    () => {
      const hx = document.querySelectorAll('article [id]');
      let c = null;
      for (let i of hx) {
        const { top } = i.getBoundingClientRect();
        if (top - 1 > 0) break;
        c = i;
      }
      s.view = c ? c.id : null;
    },
    { passive: true },
  );

  addEventListener('click', (e) => {
    if (e.fromAside) return;
    delete s.active;
  });

  const hamburgerClick = (e) => {
    if (s.active) return;
    s.active = 'active';
    e.stopPropagation();
  };
  const asideClick = (e) => {
    e.fromAside = true;
  };

  return jkl`
    <main class="md-view ${() => s.active}" >
      <div class="hamburger" @click="${hamburgerClick}"></div>
      ${() => {
        if (md.loading) return jkl`<h2>Loading...</h2>`;
        if (md.error) return jkl`<h2 style="color: darkred;">${md.error}</h2>`;
        return jkl`
          <aside style="position: ${() => pageState.menuPos};" @click="${asideClick}">
            <h2><a href="#">${title}</a></h2>
            <ul>
              ${() => {
                if (!md.data) return;
                const list = md.data.querySelectorAll('[id]');
                return Array.from(list, (h) => {
                  const level = h.tagName.match(/\d+/) - 1;
                  const id = h.getAttribute('id');
                  const href = `#${encodeURIComponent(id)}`;
                  const visiting = () => (id === s.view ? 'visiting' : '');
                  const active = () => (href === pageState.hash ? 'active' : '');
                  return jkl`
                    <li style="margin-left: ${level}em;" class="${visiting} ${active}">
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
