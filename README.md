<h1 align="center" style="font-size: 30px;">create-relay-app</h1>
<p align="center">Easy configuration of <a href="https://relay.dev">Relay.js</a> for existing projects</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tobiastengler/create-relay-app" alt="npm.js package link">
    <img src="https://img.shields.io/npm/v/@tobiastengler/create-relay-app?color=F50057" alt="Latest version published to npm" />
    <img src="https://img.shields.io/npm/dm/@tobiastengler/create-relay-app?color=1976D2" alt="npm downloads per month" />
    <img src="https://img.shields.io/npm/l/@tobiastengler/create-relay-app?color=00C853" alt="Project license" />
  </a>
</p>

<p align="center">
  <img src="./showcase.gif" alt="Showcase" />
</p>

## Motivation

Setting up Relay can be quite time consuming, since there are _many_ setup steps that might differ depending on the toolchain you use.

The goal of this project is to automate the setup process as much as possible and give you a fast and consistent configuration experience across the most popular React toolchains.

Contrary to many existing tools that aim to solve similiar use cases, this project isn't simply scaffolding a pre-configured boilerplate. We actually analyze your existing code and only insert the necessary Relay configuration pieces.

## Supported toolchains

`create-relay-app` supports:

- [Next.js](https://nextjs.org/) (the v13 App Router is not yet supported)
- [Vite.js](https://vitejs.dev/)
- [Create React App](https://create-react-app.dev/)

## Usage

1. Scaffold a new project using the toolchain of your choice (as long as [it's supported](#supported-toolchains))
   - [Next.js](https://nextjs.org/docs#automatic-setup)
   - [Vite.js](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)
   - [Create React App](https://create-react-app.dev/docs/getting-started)
2. If you are inside a Git repository, ensure your working directory is clean, by commiting or discarding any changes.
3. Run the script inside of the scaffolded directory:

```bash
npm/yarn/pnpm create @tobiastengler/relay-app
```

> Note: You can specify `-i` after the command to walk through an interactive prompt, instead of the script inferring your project's details.

4. Follow the displayed _Next steps_ to complete the setup (You can also find them [here](./docs/steps-after-setup.md))

## Arguments

```bash
npm/yarn/pnpm create @tobiastengler/relay-app [options]
```

> **Warning**
> 
> npm requires you to pass `--` before any command to a starter kit, e.g.
> 
> `npm create @tobiastengler/relay-app -- --interactive`.

### -h, --help

Displays information about all of the available options.

### -v, --version

Displays the current version of the script.

### -i, --interactive

Displays an interactive prompt that allows you to manually input your project's details for options that weren't supplied as CLI arguments.

Default: `false`

### -t, --toolchain &lt;toolchain&gt;

The toolchain, e.g. bundler and configuration, your project was setup with.

Expects:

- `next`
- `vite`
- `cra`

Default: `next`, if the `next` package is installed. `vite`, if the `vite` package is installed and otherwise `cra`.

### --typescript

If specified, we assume your project is built with TypeScript.

Default: `true`, if the `typescript` package is installed **or** there is a `tsconfig.json` file in the root directory of your project. Otherwise `false`.

### -f, --schema-file &lt;path&gt;

Specifies the location of the GraphQL schema file inside of your project directory.

Expects:

A path relative to the root directory of your project and ending in the `.graphql` extension.

Default: `./src/schema.graphql`, if the [toolchain](#t---toolchain-toolchain) is `next`, otherwise the value of [--src](#s---src-path) joined with `schema.graphql`.

### -s, --src &lt;path&gt;

Specifies the source directory of your project, where the Relay compiler will be run on.

Expects:

A path to a directory relative to the root directory of your project.

Default: `./`, if the [toolchain](#t---toolchain-toolchain) is `next`, otherwise `./src`.

### -a, --artifact-directory &lt;path&gt;

Specifies a directory, where all artifacts generated by the Relay compiler will be placed.

Expects:

A path to a directory relative to the root directory of your project.

Default: `./__generated__`, if the [toolchain](#t---toolchain-toolchain) is `next`, otherwise it's not set.

### --subscriptions

Adds support for GraphQL Subscriptions via [graphql-ws](https://github.com/enisdenjo/graphql-ws) to your network layer.

Default: Not set.

### -p, --package-manager &lt;manager&gt;

Specify the Node.js package manager to use when packages need to be installed.

Expects:

- `npm`
- `yarn`
- `pnpm`

Default: `yarn`, if there's a `yarn.lock` file and `yarn` is installed. `pnpm`, if there's a `pnpm-lock.yml` file and `pnpm` is installed. Otherwise the package manager that is executing the script will be used to install packages.

### --ignore-git-changes

Does not exit the script, if it's run in a directory with un-commited Git changes.

Default: `false`

### --skip-install

Skips the installation of packages.

Default: `false`

## Additional documents

- [Manual steps after running the script](./docs/steps-after-setup.md)
- [Data fetching with Next.js](./docs/next-data-fetching.md)
- [babel-plugin-relay in combination with Create-React-App](./docs/cra-babel-setup.md)
