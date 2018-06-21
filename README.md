<p align="center"><img src="https://raw.githubusercontent.com/ackwell/xivanalysis/master/public/logo.png" alt="logo"></p>
<h1 align="center">xivanalysis</h1>

Automated performance analysis and suggestion platform for Final Fantasy XIV: Stormblood, using data sourced from [FF Logs](https://www.fflogs.com/).

## Getting Started

Before starting, you will need:

- [git](https://git-scm.com/)
- [node.js](https://nodejs.org/en/) 8.x (10.x currently breaks the build)
- [yarn](https://yarnpkg.com/lang/en/)

Next up, you'll need to get the project itself running. If you intend to contribute changes, [create a fork](https://help.github.com/articles/fork-a-repo/) of the project, and use your fork's URL in place of the main project's.

```bash
# Clone the project
git clone https://github.com/xivanalysis/xivanalysis.git
cd xivanalysis

# Install dependencies (this may take some time)
yarn
```

Copy the `.env.local.example` file in the project root, and call it `.env.local`.

- Replace `TODO_FINAL_DEPLOY_URL` with `https://www.fflogs.com/v1/`.
- Replace `INSERT_API_KEY_HERE` with your public fflogs api key. If you don't have one, you can [get yours here](https://www.fflogs.com/accounts/changeuser).

*NOTE: If you are also configuring the [server](https://github.com/xivanalysis/server) locally, you can use `[server url]/proxy/fflogs/` as the base url, and omit the api key.*

Once that's done, you're ready to go! To start the development server, just run

```bash
yarn start
```
