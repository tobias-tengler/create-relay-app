If certain options are not specified as [CLI arguments](./cli-arguments.md), we try to infer most of them from the directory you ran the script from.

### --yes

`false`, unless specified.

### --toolchain

If the `next` package is installed, we assume it's a _Next.js_ project, unless specified otherwise.

If the `vite` package is installed, we assume it's a _Vite.js_ project, unless specified otherwise.

Otherwise, we assume it's a _Create React App_ project, unless specified otherwise.

### --typescript

If the `typescript` package is installed **or** there is a `tsconfig.json` file in the root directory of your project, we assume you are using Typescript, unless specified otherwise.

### --schema-file

If the [toolchain](./cli-arguments.md#t---toolchain-lttoolchaingt) is `next`, `./src/schema.graphql`, otherwise the value of [--src](#s---src-ltpathgt) joined with `schema.graphql`, unless specified otherwise.

### --src

If the [toolchain](./cli-arguments.md#t---toolchain-lttoolchaingt) is `next`, `./`, otherwise `./src`, unless specified otherwise.

### --artifact-directory

If the [toolchain](./cli-arguments.md#t---toolchain-lttoolchaingt) is `next`, `./__generated__`, otherwise it's not specified, unless specified otherwise.

### --package-manager

If you run the script using `yarn` or `pnpm`, we use them as the default.

If we can't determine which package manger has run the script, we choose:

- `yarn`, if `yarn` is installed **and** a `yarn.lock` file exists at the root of the project.
- `pnpm`, if `pnpm` is installed **and** a `pnpm-lock.yml` file exists at the root of the project.
- `npm` in all other cases.

### --ignore-git-changes

`false`, unless specified.

### --skip-install

`false`, unless specified.
