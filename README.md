<h1 align="center" style="font-size: 30px;">create-relay-app</h1>
<p align="center">Easy configuration of <a href="https://relay.dev">Relay.js</a> for existing projects</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tobiastengler/create-relay-app" alt="npm.js package link">
    <img src="https://img.shields.io/npm/v/@tobiastengler/create-relay-app?color=F50057" alt="Latest version published to npm" />
    <img src="https://img.shields.io/npm/dm/@tobiastengler/create-relay-app?color=1976D2" alt="npm downloads per month" />
    <img src="https://img.shields.io/npm/l/@tobiastengler/create-relay-app?color=00C853" alt="Project license" />
  </a>
</p>

## Motivation

Setting up Relay can be quite time consuming. The goal of this project is to automate all of the manual setup steps involved, to give you a fast and consistent configuration experience across the most popular React toolchains.

## Supported toolchains

`create-relay-app` supports:

- [Create React App](https://create-react-app.dev/) (WIP)
- [Vite.js](https://vitejs.dev/)
- [Next.js](https://nextjs.org/)

## Usage

Once you have scaffolded a project using your preferred toolchain of choice, simply execute the `@tobiastengler/create-relay-app` script in the directory of your project:

```bash
npx @tobiastengler/create-relay-app
```

> Note: We are working on getting the `create-relay-app` name!

This will prompt you for a bunch of questions around your project setup. If you do not want to specify these options interactively, you can also specify them through the [CLI arguments](#cli-arguments). Passing `-y` will infer all settings based on your project.

## CLI arguments

```bash
npx @tobiastengler/create-relay-app [options]
```

### -y, --yes

Skips any prompts and chooses [default values](#default-values) for options that weren't supplied as CLI arguments.

### -t, --toolchain &lt;toolchain&gt;

The toolchain, e.g. bundler and configuration, your project was setup with.

_Possible values_

- cra [_Create React App_](https://create-react-app.dev/)
- vite [_Vite.js_](https://vitejs.dev/)
- next [_Next.js_](https://nextjs.org/)

_Example_

```bash
--toolchain vite
```

### --typescript

If specified, we assume your project is built with Typescript.

### -s, --schema-file &lt;path&gt;

Specifies the location of the GraphQL schema file inside of your project directory.

_Possible values_

A path relative to the root directory of your project and ending in the `.graphql` extension.

_Example_

```bash
--schema-file ./src/schema.graphql
```

### -p, --package-manager &lt;manager&gt;

Specify the Node.js package manager to use when packages need to be installed.

_Possible values_

- npm
- yarn
- pnpm

_Example_

```bash
--package-manager yarn
```

### --ignore-git-changes

If specified, the script will not exit, if it's run in a directory with un-commited Git changes.

### -v, --version

Displays the current version of the script.

### -h, --help

Displays information about all of the available options.

## Default values

If certain options are not specified as CLI arguments, we try to infer most of them from the directory you ran the script from.

### --toolchain

If there is a `next.config.js` file in the root directory of your project, we assume it's a _Next.js_ project, unless specified otherwise.

If there is a `vite.config.js` or `vite.config.ts` file in the root directory of your project, we assume it's a _Vite.js_ project, unless specified otherwise.

If none of the files above are matched, we assume it's a _Create React App_ project, unless specified otherwise.

### --typescript

If the `typescript` package is installed **or** there is a `tsconfig.json` file in the root directory of your project, we assume you are using Typescript, unless specified otherwise.

### --package-manager

If you run the script using `yarn` or `pnpm`, we use them as the default.

If we can't determine which package manger has run the script, we choose:

- `yarn`, if `yarn` is installed and a `yarn.lock` file exists at the root of the project.
- `pnpm`, if `pnpm` is installed and a `pnpm-lock.yml` file exists at the root of the project.
- `npm` in all other cases.

### --schema-file

`./schema.graphql`, unless specified otherwise.

### --yes

`false`, unless specified.

### --ignore-git-changes

`false`, unless specified.
