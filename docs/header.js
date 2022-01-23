import { jkl } from 'https://cdn.jsdelivr.net/npm/jinkela@2.0.0-dev1/dist/index.esm.js';

export const header = () => {
  return jkl`
    <header>
      <a class="logo" href=".">
        <img src="./willan.png" alt="logo" />
      </a>
      <h1>Jinkela v2</h1>
    </header>
  `;
};
