<p align="center"><a href="https://xivanalysis.com/" alt="xivanalysis"><img src="https://raw.githubusercontent.com/ackwell/xivanalysis/master/public/logo.png" alt="logo"></a></p>
<h1 align="center">xivanalysis</h1>
<p align="center">
	<a href="https://github.com/xivanalysis/xivanalysis/actions/workflows/build.yml" title="Build"><img src="https://img.shields.io/github/actions/workflow/status/xivanalysis/xivanalysis/build.yml?style=flat-square" alt="Build"></a>
	<a href="https://discord.gg/jVbVe44" title="Discord"><img src="https://img.shields.io/discord/441414116914233364.svg?style=flat-square&amp;logo=discord&amp;colorB=7289DA" alt="Discord"></a>
</p>

Automated performance analysis and suggestion platform for Final Fantasy XIV, using data sourced from [FF Logs](https://www.fflogs.com/).

If you'd like to contribute, check past [our developer documentation](https://docs.xivanalysis.com/) for an introduction to the project and steps to get started!

## Table of Contents

- [Translations](#translations)
- [Structure of the parser](#structure-of-the-parser)
	- [Module groups](#module-groups)
	- [Modules](#modules)

## Translations

We use [Crowdin](https://crowdin.com/project/xivanalysis) to manage and maintain our translations.
If you would like to contribute new or corrected translation strings, please join our [CrowdIn project](https://crowdin.com/project/xivanalysis).

We support the languages that FFXIV officially supports:

- Japanese (日本語)
- German (Deutsch)
- French (Français)
- Korean (한국어)
- Chinese Simplified (简体中文)

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

For more details, have a look through the `core` and `jobs/smn` modules.
