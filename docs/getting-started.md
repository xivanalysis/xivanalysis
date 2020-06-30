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
$ git clone https://github.com/[username]]/xivanalysis.git
$ cd xivanalysis
```

At this point, it's highly suggested you [configure an upstream remote](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/configuring-a-remote-for-a-fork), and make sure you [sync it down](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork) reasonably frequently - you can check the `#auto-github` channel on Discord to get an idea of what's been changed.

**NOTE:** Drop past our Discord channel before you get too into it, have a chat! Duping up on implementations is never fun.
{: .admonition .tip}

You've now got the primary codebase locally, next you'll need to download all the project's dependencies. Please do use `yarn` for this - using `npm` will ignore the lockfile, and potentially pull down untested updates.

```bash
$ yarn
```

While `yarn` is running, copy the `.env.local.example` file in the project root, and call it `.env.local`. Replace `INSERT_API_KEY_HERE` with your public fflogs api key. If you don't have one, you can [get yours here](https://www.fflogs.com/profile). Don't forget to set your Application Name there as well.

**NOTE:** If you are also configuring the [server](https://github.com/xivanalysis/server) locally, you can replace the default value of `REACT_APP_LOGS_BASE_URL` with `[server url]/proxy/fflogs/` as the base url, and omit the api key.
{: .admonition .info}

Once that's done, you're ready to go! To start the development server, just run

```bash
$ yarn start
```

If you would like to compile a production copy of the assets (for example, to be served when testing the server), run

```bash
$ yarn build
```
