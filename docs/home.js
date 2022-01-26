const { jkl, createState, request } = Jinkela;

const navState = request(() => {
  return fetch('./nav.json').then((r) => r.json());
});

const title = 'Jinkela v2';
const description = '自认为是一个前端框架';
const content = jkl`
  <div class="home">
    <nav>
      ${() => {
        const { data } = navState;
        if (!data) return 'Loading...';
        return data.map(({ text, ...rest }) => {
          return jkl`<span><a ${rest}>${text}</a></span>`;
        });
      }} 
    </nav>
    <a class="logo" href="docs.html?d=intro">
      <img src="./willan.png" alt="logo" />
    </a>
    <h1><a href="docs.html?d=intro">${title}</a></h1>
    <h2>${description}</h2>
  </div>`;

document.body.appendChild(content);
