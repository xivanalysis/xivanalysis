---
nav_order: 1
---

# Getting Started

To work on xivanalysis, you'll need [git], and a "fork" of the xiva codebase. If
not familiar, github's instructions for [creating a fork] and its linked pages
walk through the process of installing and configuring git, and creating a fork.

[git]: https://git-scm.com/
[creating a fork]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo

Following those instructions should result in a copy of the repository on your
github account, and a local clone of the repository on your computer. Make sure
you have used `cd` to go into the repository.

## Installing development tools

There are a few ways to set up the required tools to work on xivanalysis. The
recommended approach is to use `mise`, a configuration file for which is
included in the repository.

### Using `mise`

[`mise`][mise] is a version manager for languages and toolchains, and can be
used to set up and manage the environment required to work on xivanalysis.

1. Install mise following the [installation instructions]
2. run `mise install`<br>
   if you are asked to trust `mise.toml`, select "yes"<br>
	 you can check the contents of `mise.toml` if concerned - it contains only a
	 short list of required runtimes and tools.

[mise]: https://mise.jdx.dev/
[installation instructions]: https://mise.jdx.dev/installing-mise.html

### Using `corepack`

If you have an existing setup or would otherwise prefer to not use `mise`,
`corepack` can be used to used instead:

[`corepack`][corepack] is a tool bundled with Node.js that helps manage the
package managers used in javascript projects.

1. Install Node.js v22 using your preferred version manager, or from the
   [Node.js website].
2. run `corepack install`

[corepack]: https://nodejs.org/docs/latest-v22.x/api/corepack.html
[Node.js website]: https://nodejs.org/en/download

## Preparing environment

With the tools installed, you'll need to download the project's dependencies.
Please do use `pnpm` for this - using `yarn` or `npm` will potentially result in
untested updates that fail to compile.

```bash
$ pnpm install
```

<details markdown="1">
<summary>Setup for local server development</summary>

If you are configuring the [server] locally, you can configure the xivanalysis
client to use it for API requests.

To do so, create an `.env.local` file containing the following:

```
REACT_APP_FFLOGS_V1_BASE_URL=[server_url]/proxy/fflogs/
```

[server]: https://github.com/xivanalysis/server

</details>

## Making changes

**NOTE:** Drop past our Discord channel before you get too into it, have a chat! Duping up on implementations is never fun.
{: .admonition .tip }

To start the development server, just run

```bash
$ pnpm run start
```

If you would like to compile a production copy of the assets (for example, to be served when testing the server), run

```bash
$ pnpm run build
```
