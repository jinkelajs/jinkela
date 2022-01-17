import { jkl } from 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-dev1/dist/index.esm.js';

export const makeCodePreview = () => {
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
