<p align="center"><a href="https://xivanalysis.com/" alt="xivanalysis"><img src="https://raw.githubusercontent.com/ackwell/xivanalysis/master/public/logo.png" alt="logo"></a></p>
<h1 align="center">xivanalysis</h1>
<p align="center">
	<a href="https://circleci.com/gh/xivanalysis/xivanalysis" title="Build"><img src="https://img.shields.io/circleci/project/github/xivanalysis/xivanalysis.svg?style=flat-square" alt="Build"></a>
	<a href="https://david-dm.org/xivanalysis/xivanalysis" title="Dependency status"><img src="https://img.shields.io/david/xivanalysis/xivanalysis.svg?style=flat-square" alt="Dependency status"></a>
	<a href="https://discord.gg/jVbVe44" title="Discord"><img src="https://img.shields.io/discord/441414116914233364.svg?style=flat-square&amp;logo=discord&amp;colorB=7289DA" alt="Discord"></a>
</p>

Automated performance analysis and suggestion platform for Final Fantasy XIV: Shadowbringers, using data sourced from [FF Logs](https://www.fflogs.com/).

## Table of Contents

- [Getting started](#getting-started)
- [Structure of the parser](#structure-of-the-parser)
	- [Module groups](#module-groups)
	- [Modules](#modules)
- [Internationalization](#internationalization-i18n)
- [API Reference](#api-reference)
	- [Module](#module)
	- [Parser](#parser)

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

***NOTE:*** *Drop past our Discord channel before you get too into it, have a chat! Duping up on implementations is never fun.*

If you are working with a fork, I would highly suggest [configuring an upstream](https://help.github.com/articles/configuring-a-remote-for-a-fork/) remote, and making sure you [sync it down](https://help.github.com/articles/syncing-a-fork/) reasonably frequently - you can check the #automations channel on Discord to get an idea of what's been changed.

You've now got the primary codebase locally, next you'll need to download all the project's dependencies. Please do use `yarn` for this - using `npm` will ignore the lockfile, and potentially pull down untested updates.

```bash
yarn
```

While `yarn` is running, copy the `.env.local.example` file in the project root, and call it `.env.local`. Make a few changes in it:

- Replace `TODO_FINAL_DEPLOY_URL` with `https://www.fflogs.com/v1/`.
- Replace `INSERT_API_KEY_HERE` with your public fflogs api key. If you don't have one, you can [get yours here](https://www.fflogs.com/profile). Don't forget to set your Application Name there as well.

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

Each module should be in charge of analysing a single statistic or feature, so as to keep them as small and digestible as reasonably possible. To aid in this, modules are able to 'depend' on others, and directly access any data they may expose. Modules are guaranteed to run _before_ anything that depends on them - this also implicitly prevents circular dependencies from being formed (an error will be thrown).

For more details, check out the API Reference below, and have a look through the `core` and `jobs/smn` modules.

## Internationalization (i18n)

This project makes use of [jsLingui](https://github.com/lingui/js-lingui) with a dash of custom logic to make dynamic content a bit easier. It's recommended to familiaise yourself with [its available components](https://lingui.js.org/ref/react.html#components) to help implementation.

All text displayed to the end-user should be passed through this translation layer. See below for a few examples.

### i18n IDs

All translated strings should be given an explicit ID, to help keep things consistent. This project formats i18n IDs using the syntax: `[job].[module].[thing]`

As an example, for a Red Mage you might end up with the key `rdm.gauge.white-mana`. These
keys should be somewhat descriptive to make it clear for translators what exactly they're editing.

### Examples

#### Module titles

If your module has `output`, it should also be given a translated title. This title will be shown above its output, as well as used for the link in the sidebar.

```javascript
import {t} from '@lingui/macro'
import Module from 'parser/core/Module'

export default class MyModule extends Module {
	// ...
	static title = t('my-job.my-module.title')`My Module`
	// ...
}
```

#### JSX content

In most cases, you can skip the peculiar syntax shown above, and use the `Trans` JSX tag, which automates a _lot_ of the hard yards for you. This is commonly seen in use in module output and suggestions, among other things. There's a number of other utility tags besides `Trans`, such as `Plural` - see [the lingui documentation](https://lingui.js.org/ref/react.html#components) for more info.

```javascript
import {Trans, Plural} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const supportedLanguages = 6
this.suggestions.add(new Suggestion({
	icon: ACTIONS.RAISE.icon,
	severity: SEVERITY.MORBID,
	content: <Trans id="my-job.my-module.suggestions.my-suggestion.content">
		You should <strong>really</strong> use localization.
	</Trans>,
	why: <Trans id="my-job.my-module.suggestions.my-suggestion.why">
		Localization is important, we support
		<Plural
			value={supportedLanguages}
			one="# language"
			other="# languages"
		/>
	</Trans>,
}))
```

#### Markdown

Sometimes, you _really_ gotta put a lot of content in - it's cases like this that markdown comes in handy. We use a slightly extended syntax based on [CommonMark](https://commonmark.org/).

Key differences:

* `[~action/ACTION_KEY]` will automatically turn into an `ActionLink` with icon, tooltip, and similar.
* `[~status/STATUS_KEY]` will likewise automatically turn into a `StatusLink`.
* Don't use code blocks (`` `...` ``). Just... don't. Please. It breaks everything.

```javascript
import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'

const description = t('your-job.about.description')`
This is an _example_ of using **markdown** in conjunction with the TransMarkdown component.

I am also [contractually](https://some-url.com/) obliged to remind you to [~action/RUIN_III] everything.
`
const rendered = <TransMarkdown source={description}/>
```

## API Reference
### Module

All modules should extend this class at some point in their hierarchy. It provides helpers to handle events, and provides a standard interface for the parser to work with.

#### Properties
##### `static handle`

**Required.** The name that should be used to reference this module throughout the system/dependencies. Without this set, the module will break during build minification.

##### `static title`

The name that should be shown above any output the module generates. If not set, it will default to the module's `handle`, with the first letter capitalised.

Should be wrapped in the `t(id)` template from `@lingui/macro`, [see above for details](#module-titles).

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

An object representing the added hook is returned, that can be later used to modify it. The actual structure of this hook object should not be relied upon.

##### `output()`

Override this function to provide output for the user. Any markup returned will be displayed on the analysis page, under a header defined by `static title`.

Return `false` (the default implementation does this) to prevent generating output for the module.

##### `normalise(events)`

Override this function if the module absolutely _needs_ to process events before the official 'parse', such as to add missing `applybuff` events. Avoid if `addHook` could be used instead.

`events` is an array of every event that is about to be parsed.

Return value should be the `events` array, with any required modifications made to it. Failing to return this will prevent the parser from parsing any events at all.

##### `getErrorContext(source, error, event)`

Override this function to customize the information that the module provides for automatic
error reporting. This function is called when an error occurs in event hooks or the
`output()` method on the faulting module as well as all modules that module depends on.

`source` is either `event` or `output`
`error` is the error that occurred
`event` is the error that was being processed when the error occurred, if applicable

If this function is not overridden or if this function returns undefined, primitive values
will be scraped from the module and uploaded with the error report.

### Parser

The core parser object, orchestrating the modules and providing meta data about the fight. All modules have access to an instance of this via `this.parser`.

#### Properties
##### `report`, `fight`, `player`

The full report metadata object, and the specific fight and player object from it for the current parse, respectively. The data in these is direct from FFLogs, check your networking tab to see the structure.

##### `currentTimestamp`

The timestamp of the event currently being parsed in ms. Note that timestamps do _not_ start at 0. Subtract `fight.start_time` to get a relative timestamp

##### `fightDuration`

The _remaining_ duration in the fight (yes, I'm aware it's badly named), in ms.

##### `fightFriendlies`

An array of friendly actors that took part in the fight currently being parsed.

#### Methods
##### `fabricateEvent(event[, trigger])`

Trigger an event throughout the system.

`event` should be the event object being called. A `type` property _must_ be defined for this do anything. If not specified, `timestamp` will be set to the current timestamp.

##### `byPlayer(event[, playerId])`, `toPlayer(event[, playerId])`

Checks if the specified event was by/to the specified player. If `playerId` is not set, the current user will be used.

##### `byPlayerPet(event[, playerId])`, `toPlayerPet(event[, playerId])`

The same as their `xxPlayer` counterparts, but check if the event was by/to one of the specified player's pets.

##### `formatDuration(duration[, secondPrecision])`

Formats the specified duration (in ms) as a `MM:SS` string. If under 60s, will display seconds with specified precision (default 2 decimal places).

##### `formatTimestamp(timestamp[, secondPrecision])`

The result of `formatDuration` for the duration of the fight up until the specified timestamp.
