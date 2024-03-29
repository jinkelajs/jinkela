const { jkl, request } = Jinkela;

const navState = request(() => {
  return fetch('./nav.json').then((r) => r.json());
});

export const header = () => {
  return jkl`
    <header class="header">
      <a class="logo" href=".">
        <img src="./willan.svg" alt="logo" />
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
