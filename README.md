<h1 align="center" style="font-size: 30px;">create-relay-app</h1>
<p align="center">Easy configuration of <a href="https://relay.dev">Relay.js</a> for existing projects</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@tobiastengler/create-relay-app" alt="npm.js package link">
    <img src="https://img.shields.io/npm/v/@tobiastengler/create-relay-app?color=F50057" alt="Latest version published to npm" />
    <img src="https://img.shields.io/npm/dm/@tobiastengler/create-relay-app?color=1976D2" alt="npm downloads per month" />
    <img src="https://img.shields.io/npm/l/@tobiastengler/create-relay-app?color=00C853" alt="Project license" />
  </a>
</p>

<p align="center"style="font-size: 26px">⚠️ This project is still experimental! ⚠️</p>

<p align="center">
  <img src="./showcase.gif" alt="Showcase" />
</p>

## Motivation

Setting up Relay can be quite time consuming, since there are _many_ setup steps that might differ, depending on the toolchain you use.

The goal of this project is to automate the setup process as much as possible and give you a fast and consistent configuration experience across the most popular React toolchains.

Contrary to many existing tools that aim to solve similiar use cases, this project isn't simply scaffolding a pre-configured boilerplate. We actually analyze your existing code and only insert the necessary Relay configuration pieces.

## Supported toolchains

`create-relay-app` supports:

- [Create React App](https://create-react-app.dev/) (WIP)
- [Vite.js](https://vitejs.dev/)
- [Next.js](https://nextjs.org/)

## Usage

1. Scaffold a new project using the toolchain of your choice (as long as [it's supported](#supported-toolchains)
   - Next.js: `yarn create next-app --typescript`
   - Vite.js: `yarn create vite --template react-ts`
   - Create React App: `yarn create react-app <new-project-directory> --template typescript`
2. Install all the packages and ensure that the template is functioning. If it comes with a Git repository, ensure your working directory is clean, by commiting or discarding any changes.
3. Run the script inside of the scaffolded directory:

```bash
npx -y @tobiastengler/create-relay-app
```

> Note: We are working on getting the `create-relay-app` name!

This will prompt you for a bunch of questions around your project setup. If you do not want to specify these options interactively, you can also specify them through the [CLI arguments](./docs/cli-arguments.md). Passing `-y` will [infer all arguments](./docs/default-values.md) based on your project.
