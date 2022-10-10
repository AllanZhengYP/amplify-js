const { join } = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require('@rollup/plugin-babel');
const postcss = require('rollup-plugin-postcss');
const json = require('@rollup/plugin-json');
const { terser } = require('rollup-plugin-terser');
const replace = require('@rollup/plugin-replace');

export default {
	input: join(__dirname, 'src/main.jsx'),
	output: {
		file: join(__dirname, 'dist', 'rollup', 'main.js'),
		format: 'iife',
		sourcemap: true,
	},
	context: 'window',
	plugins: [
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
			preventAssignment: true,
		}),
		nodeResolve({
			extensions: ['.js', '.jsx'],
			preferBuiltins: false,
			browser: true,
		}),
		commonjs(),
		json(),
		babel({
			presets: ['@babel/preset-react'],
			babelHelpers: 'bundled',
		}),
		postcss({
			extensions: ['.css'],
		}),
		terser(),
	],
};
