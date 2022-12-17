If certain options are not specified as [CLI arguments](./cli-arguments.md), we try to infer most of them from the directory you ran the script from.

### --interactive

`false`, unless specified.

### --toolchain

If the `next` package is installed, we assume it's a _Next.js_ project, unless specified otherwise.

If the `vite` package is installed, we assume it's a _Vite.js_ project, unless specified otherwise.

Otherwise, we assume it's a _Create React App_ project, unless specified otherwise.

### --typescript

If the `typescript` package is installed **or** there is a `tsconfig.json` file in the root directory of your project, we assume you are using TypeScript, unless specified otherwise.

### --schema-file

If the [toolchain](./cli-arguments.md#t---toolchain-lttoolchaingt) is `next`, `./src/schema.graphql`, otherwise the value of [--src](#s---src-ltpathgt) joined with `schema.graphql`, unless specified otherwise.

### --src

If the [toolchain](./cli-arguments.md#t---toolchain-lttoolchaingt) is `next`, `./`, otherwise `./src`, unless specified otherwise.

### --artifact-directory

If the [toolchain](./cli-arguments.md#t---toolchain-lttoolchaingt) is `next`, `./__generated__`, otherwise it's not specified, unless specified otherwise.

### --subscriptions

`false`, unless specified.

### --package-manager

If the script was **not** run with `yarn`, but there is a `yarn.lock` file and `yarn` is installed, we will choose `yarn`.

If the script was **not** run with `pnpm`, but there is a `pnpm-lock.yml` file and `pnpm` is installed, we will choose `pnpm`.

In all other cases we will choose the package manager that executed the script or `npm`.

### --ignore-git-changes

`false`, unless specified.

### --skip-install

`false`, unless specified.
