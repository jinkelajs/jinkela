import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';

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
    typescript({
      tsconfigOverride: {
        include: ['src', 'types.d.ts'],
      },
    }),
    uglify(),
  ],
};

module.exports = [jinkela];
