import { jkl, request } from 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-dev4/dist/index.esm.js';

const navState = request(() => {
  return fetch('./nav.json').then((r) => r.json());
});

export const header = () => {
  return jkl`
    <header class="header">
      <a class="logo" href=".">
        <img src="./willan.png" alt="logo" />
      </a>
      <h1>Jinkela v2</h1>
      <div style="flex: 1;"></div>
      <div class="menu-wrapper">
        <a class="hamburger" href="#"></a>
        <div class="menu">
          <a href="./">首页</a>
          ${() => {
            const { data } = navState;
            if (!data) return 'Loading...';
            return data.map(({ text, ...rest }) => {
              if (rest.href.endsWith(location.search)) rest.class = 'current';
              return jkl`<a ${rest}>${text}</a>`;
            });
          }}
        </div>
      </div>
    </header>
  `;
};
