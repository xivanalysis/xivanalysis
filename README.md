<p align="center"><img src="https://raw.githubusercontent.com/ackwell/xivanalysis/master/public/logo.png" alt="logo"></p>
<h1 align="center">xivanalysis</h1>
<p align="center">
	<a href="https://circleci.com/gh/xivanalysis/xivanalysis" title="Build"><img src="https://img.shields.io/circleci/project/github/xivanalysis/xivanalysis.svg?style=flat-square" alt="Build"></a>
	<a href="https://david-dm.org/xivanalysis/xivanalysis" title="Dependency status"><img src="https://img.shields.io/david/xivanalysis/xivanalysis.svg?style=flat-square" alt="Dependency status"></a>
	<a href="https://discord.gg/jVbVe44" title="Discord"><img src="https://img.shields.io/discord/441414116914233364.svg?style=flat-square&amp;logo=discord&amp;colorB=7289DA" alt="Discord"></a>
</p>

Automated performance analysis and suggestion platform for Final Fantasy XIV: Stormblood, using data sourced from [FF Logs](https://www.fflogs.com/).

## Table of Contents

- [Getting started](#getting-started)
- [Structure of the parser](#structure-of-the-parser)
	- [Module groups](#module-groups)
	- [Modules](#modules)

## Getting Started

Before starting, you will need:

- [git](https://git-scm.com/)
- [node.js](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/lang/en/)

Once you've set those up, you'll need to pull down the codebase. If you plan to contribute code, you'll need to [create a fork](https://help.github.com/articles/fork-a-repo/) of the project first, and use your fork's URL in place of the main project's when cloning.

```bash
# Clone the project
git clone https://github.com/xivanalysis/xivanalysis.git
cd xivanalysis
```

If you are working with a fork, I would highly suggest [configuring an upstream](https://help.github.com/articles/configuring-a-remote-for-a-fork/) remote, and making sure you [sync it down](https://help.github.com/articles/syncing-a-fork/) reasonably frequently - you can check the #automations channel on Discord to get an idea of what's been changed.

You've now got the primary codebase locally, next you'll need to download all the project's dependencies. Please do use `yarn` for this - using `npm` will ignore the lockfile, and potentially pull down untested updates.

```bash
yarn
```

While `yarn` is running, copy the `.env.local.example` file in the project root, and call it `.env.local`. Make a few changes in it:

- Replace `TODO_FINAL_DEPLOY_URL` with `https://www.fflogs.com/v1/`.
- Replace `INSERT_API_KEY_HERE` with your public fflogs api key. If you don't have one, you can [get yours here](https://www.fflogs.com/accounts/changeuser).

***NOTE:*** *If you are also configuring the [server](https://github.com/xivanalysis/server) locally, you can use `[server url]/proxy/fflogs/` as the base url, and omit the api key.*

Once that's done, you're ready to go! To start the development server, just run

```bash
yarn start
```

If you would like to compile a production copy of the assets (for example, to be served when testing the server), run

```bash
yarn build
```

## Structure of the parser

The parser is the meat of xivanalysis. Its primary job is to orchestrate modules, which read event data and output the final analysis.

### Module groups

The modules are split into a number of groups:

- `core`: Unsurprisingly, the core system modules. These provide commonly-used functionality (see the section on dependency below), as well as job-agnostic modules such as "Don't die".
- `jobs/[job]`: Each supported job has its own group of modules, that provide specialised analysis/information for that job.
- `bosses/[boss]`: Like jobs, some bosses have groups of modules, usually used to analyse unique fight mechanics, or provide concrete implementations that fflogs does not currently provide itself.

Modules from `core` are loaded first, followed by bosses, then jobs.

Each group of modules is contained in its own folder, alongside any other required files. All groups also require an `index.js`, which provides a reference to all the modules that should be loaded. These index files are referenced in `parser/AVAILABLE_MODULES.js`

### Modules

Modules (which've been mentioned a few times already!) form the nitty-gritty of the parser's analysis. The parser itself simply orchestrates the modules - it's the modules that truly _analyse_ the data and provide output.

As a cliche example, a module Hello World:

```js
import Module from 'parser/core/Module'

export default class HelloWorld extends Module {
	static handle = 'hello'

	// The name that should be shown above the module output. Only required if the module _has_ output.
	static title = 'Hello World'

	output() {
		return 'Hello, world!'
	}
}
```

Modules receive event data via function calls, called in the following order:

1. `on_event(event)`
2. `on_[event type](event)`
3. `on_[event type]_[by|to]Player[Pet]?(event)`

The event types and data are straight from fflogs - you can inspect the request to see more info.

To reduce code duplication, modules have a dependency system in place, that lets them reference other modules. Modules are guaranteed to run _before_ anything that depends on them (***NOTE:*** *this implicitly prevents circular dependencies - they will throw an error*).

The `handle` static property is the name that should be used to reference dependencies. Any dependencies specified for a module are then made available at runtime as `this.[name]`.

This only covers the basics of modules, however. If you'd like to find out more, I would highly suggest checking the modules for the `core` and `jobs/smn` groups - they should provide ample examples of what can be done.
