import { build } from 'esbuild';
import brode from '@geut/esbuild-plugin-brode';
import { dirname } from 'path';

const currDir = dirname(new URL(import.meta.url).pathname);
build({
	entryPoints: [currDir + '/src/main.jsx'],
	bundle: true,
	minify: true,
	treeShaking: true,
	outdir: currDir + '/dist/esbuild',
	plugins: [brode()],
});
