import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from '@rollup/plugin-json';
import svgr from '@svgr/rollup';
import postcss from 'rollup-plugin-postcss';
import url from "@rollup/plugin-url";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/my-ui-library.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/my-ui-library.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/my-ui-library.umd.js",
      format: "umd",
      name: "MyUILibrary",
      globals: { react: "React" },
      sourcemap: true,
    },
  ],
  external: [
    /@babel\/runtime/,
    /@babel\/runtime\/helpers\/.*/,
    'react',
    'react-dom',
    "@mui/system",
    '@mui/material',
    '@emotion/react',
    '@mui/utils',
    '@mui/icons-material',
    '@emotion/styled',
    'react/jsx-runtime',
    'react/jsx-dev-runtime'
  ],
  plugins: [
    resolve({
      extensions: ['.js', '.jsx'],
      mainFields: ['module', 'main', 'browser'],
    }),
    commonjs({
      include: /node_modules/,
    }),
    json(),
    postcss(),
    svgr({
      svgo: false,
      ref: true,
      titleProp: true,
    }),
    url({
      include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif"],
      limit: 10000,
      fileName: "[name]-[hash][extname]",
      destDir: "dist/assets",
      publicPath: "/assets/"
    }),
    babel({
      babelHelpers: "runtime",
      presets: [
        "@babel/preset-env",
        [
          "@babel/preset-react",
          {
            runtime: "automatic",
            importSource: "react"
          }
        ]
      ],
      extensions: [".js", ".jsx"],
      exclude: "node_modules/**",
      plugins: ["@babel/plugin-transform-runtime"]
    }),
    terser(),
  ],
};