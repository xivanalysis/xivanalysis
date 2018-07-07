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
- [API Reference](#api-reference)
	- [Module](#module)

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

With the parser orchestrating the modules, it's down to the modules themselves to analyse the data and provide the final output.

Each module should be in charge of analysing a single statistic or feature, so azs to keep them as small and digestible as reasonably possible. To aid in this, modules are able to 'depend' on others, and directly access any data they may expose. Modules are guaranteed to run _before_ anything that depends on them - this also implicitly prevents circular dependencies from being formed (an error will be thrown).

For more details, check out the API Reference below, and have a look through the `core` and `jobs/smn` modules.

## API Reference
### Module
#### Properties
##### `static handle`

**Required.** The name that should be used to reference this module throughout the system/dependencies. Without this set, the module will break during build minification.

##### `static title`

The name that should be shown above any output the module generates. If not set, it will default to the module's `handle`, with the first letter capitalised.

##### `static dependencies`

An array of module handles that this module depends on. Modules listed here will always be executed _before_ the current module, and will be available on the `this.<handle>` instance property.

##### `static displayOrder`

A number used to control the position the module should have in the final output. The core Module file exports the `DISPLAY_ORDER` const with a few defaults.

#### Methods
##### `addHook(event[, filter], callback)`

Add an event hook.

`event` should be the name of the event you wish to listen for. `'all'` can be passed to listen for _all_ events.

`filter`, if specified, is an object specifying properties that _must_ be matched by an event for the hook to fire. Keys can be anything that the event may have. There are a few special keys and values available to the filter:

- Setting the value of a property to an array will check if _any_ of the values match the event.
- `abilityId: <value>` is shorthand for `ability: {guid: <value>}`
- `by: <value>` and `to: <value>` are shorthand for `sourceID` and `targetID` respectively, and support the following additional values:
	- `'player'`: The ID of the current player
	- `'pet'`: The IDs of all the current player's pets.

`callback` is the function that should be called when an event (optionally passing the filter) is run. It will receive the full event object as its first parameter.

A object representing the added hook is returned, that can be later used to modify it. The actual structure of this hook object should not be relied upon.

##### `output()`

Override this function to provide output for the user. Any markup returned will be displayed on the analysis page, under a header defined by `static title`.

Return `false` (the default implementation does this) to prevent generating output for the module.

##### `normalise(events)`

Override this function if the module absolutely _needs_ to process events before the official 'parse', such as to add missing `applybuff` events. Avoid if `addHook` could be used instead.

`events` is an array of every event that is about to be parsed.

Return value should be the `events` array, with any required modifications made to it. Failing to return this will prevent the parser from parsing any events at all.
