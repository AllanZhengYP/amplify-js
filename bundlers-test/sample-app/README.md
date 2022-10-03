Build this App to smoke test the compatibility with main-stream bundlers:

1. Make sure the codebase is built, refer to the [guidance](https://github.com/aws-amplify/amplify-js/blob/main/CONTRIBUTING.md#steps-towards-contributions).
1. `yarn`
1. Build the sample app with selected bundler: `yarn <bundler>:build`. Supported bundlers are `vite`, `esbuild`, `rollup`, `parcel`. The built artifact exits
   in `dist/<bundler>` folder.
1. Make sure the built App in the dist folder is valid.
