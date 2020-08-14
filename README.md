<p align="center"><a href="https://xivanalysis.com/" alt="xivanalysis"><img src="https://raw.githubusercontent.com/ackwell/xivanalysis/master/public/logo.png" alt="logo"></a></p>
<h1 align="center">xivanalysis</h1>
<p align="center">
	<a href="https://circleci.com/gh/xivanalysis/xivanalysis" title="Build"><img src="https://img.shields.io/circleci/project/github/xivanalysis/xivanalysis.svg?style=flat-square" alt="Build"></a>
	<a href="https://david-dm.org/xivanalysis/xivanalysis" title="Dependency status"><img src="https://img.shields.io/david/xivanalysis/xivanalysis.svg?style=flat-square" alt="Dependency status"></a>
	<a href="https://discord.gg/jVbVe44" title="Discord"><img src="https://img.shields.io/discord/441414116914233364.svg?style=flat-square&amp;logo=discord&amp;colorB=7289DA" alt="Discord"></a>
</p>

Automated performance analysis and suggestion platform for Final Fantasy XIV: Shadowbringers, using data sourced from [FF Logs](https://www.fflogs.com/).

If you'd like to contribute, check past [our developer documentation](https://docs.xivanalysis.com/) for an introduction to the project and steps to get started!

## Table of Contents

- [Structure of the parser](#structure-of-the-parser)
	- [Module groups](#module-groups)
	- [Modules](#modules)
- [API Reference](#api-reference) (outdated)
	- [Module](#module)
	- [Parser](#parser)

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

## API Reference (outdated)
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
