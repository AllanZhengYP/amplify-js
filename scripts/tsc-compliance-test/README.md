This is an **internal-only** package. This test is run both along with the unit tests and in the CI pipeline. The run the unit test is to make sure local changes does
not involve incompatible TS syntax. The run in the CI pipeline is to make sure the published packages are also compatible with dependencies with production installation. So we don't miss any
types dependencies

If any additional public APIs are added to the library, you must make sure the new API is included in the `publicPaths.ts`
file.
