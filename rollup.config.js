import path from 'path';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts'];

const resolve = (...args) => {
  return path.resolve(__dirname, ...args);
};

const jinkela = {
  input: resolve('./src/index.ts'),
  output: [
    {
      file: resolve('./dist/index.iife.js'),
      name: 'Jinkela',
      format: 'iife',
    },
    {
      file: resolve('./dist/index.esm.js'),
      format: 'esm',
    },
    {
      file: resolve('./dist/index.cjs.js'),
      format: 'cjs',
    },
  ],
  plugins: [
    nodeResolve({
      extensions,
      modulesOnly: true,
    }),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      extensions,
      sourceMaps: true,
    }),
  ],
};

module.exports = [jinkela];
