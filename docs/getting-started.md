---
nav_order: 1
---

# Getting Started

Before contributing, you will need to install a few tools:

- [git](https://git-scm.com/)<br>
  We use `git` to manage the source code and facilitate contributions.
- [node.js](https://nodejs.org/en/)<br>
  While xiva is primarily a static site, we use `node` to run build tools and development servers.
- [yarn](https://classic.yarnpkg.com/en/)<br>
  `yarn` is used to manage the site's package dependencies. Make sure to install yarn v1, not v2!

Once you've got those set up, you'll need to create a personal copy of the codebase and pull it down. Start by [creating a fork](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) of xivanalysis. This will create a copy of the xivanalysis codebase at `[username]/xivanalysis` - replace `[username]` in remaining examples with your username from the fork. Then, you can clone the repository:

```bash
$ git clone https://github.com/[username]/xivanalysis.git
$ cd xivanalysis
```

At this point, it's highly suggested you [configure an upstream remote](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/configuring-a-remote-for-a-fork), and make sure you [sync it down](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork) reasonably frequently - you can check the `#auto-github` channel on Discord to get an idea of what's been changed.

**NOTE:** Drop past our Discord channel before you get too into it, have a chat! Duping up on implementations is never fun.
{: .admonition .tip}

You've now got the primary codebase locally, next you'll need to download all the project's dependencies. Please do use `yarn` for this - using `npm` will ignore the lockfile, and potentially pull down untested updates.

```bash
$ yarn
```

**NOTE:** If you would like to cache FFLogs response data locally to speed up development time and avoid rate limits, you can create an `.env.local` file and set `REACT_APP_FFLOGS_V1_BASE_URL` to point to `http://localhost:5544` and run `yarn talkback` to run the [talkback](https://github.com/ijpiantanida/talkback) server, which will store
responses locally at `./tapes`
{: .admonition .info}

Once that's done, you're ready to go! To start the development server, just run

```bash
$ yarn start
```

If you would like to compile a production copy of the assets (for example, to be served when testing the server), run

```bash
$ yarn build
```
