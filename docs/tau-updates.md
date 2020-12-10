# Targetability Updates (TAU)

In cases where fflogs sends insufficient information to determine the correct information and state of a boss (invulnerability window, ephemeral enemies, etc), there is a mechanism to override this on a per-fight basis under `src/parser/bosses`.

# Setup

## Scaffolding

At current, you'll need to provide the following scaffolding / directory structure:

```
src/parser/bosses/
	${IDENTIFIER}/
		index.ts
		modules/
			Invulnerability.ts
			index.ts
```

Where `${IDENTIFIER}` is a meaningful identifier for a boss. It's important to note that in the case of savage fights, the boss id is the same between normal and savage, so there's no need to make normal and savage scaffolding for a fights.

1. In the 'root' index.ts, you'll need the following:

```ts
import {Meta} from 'parser/core/Meta'

export const e9 = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-${IDENTIFIER}" */),
})
```

Again, where `${IDENTIFIER}` is your shorthand name for the fight.

2. In the modules index.ts, you just need to export the Invulnerability module:

```ts
import {Invulnerability} from './Invulnerability'

export default [Invulnerability]
```

3. and finally, in `Invulnerability.ts` (note the capital letter at the start), this boilerplate:

```ts
import {
	Invulnerability as CoreInvulnerability,
	ActorsConfig,
} from 'parser/core/modules/Invulnerability'

export class Invulnerability extends CoreInvulnerability {
	protected actorConfig: ActorsConfig = {
		// TAU data here
	}
}
```

## Other file(s) to update

1. In `src/data/BOSSES.ts`, add a short identifier and the logID to the file. For example:

```ts
const BOSSES = ensureBosses({
	// ... other definitions
	IDENTIFIER: {logId: 1234},
})
```

2. In `src/AVAILABLE_MODULES`, You'll need to import your invulnerablity updates:

```ts
// with all the imports
import {identifier} from './bosses/identifier'

// In the BOSSES section of AVAILABLE_MODULES
const AVAILABLE_MODULES: AvailableModules = {
	// ...
	BOSSES: {
		[BOSSES.IDENTIFIER.logId]: identifier,
	},
}
```

# Setting up your config

In the `Invulnerability.ts` file for your fight, there are 3 options per actor ID:

* start (takes a string)
* end (takes a string)
* exclude (takes a boolean)

For example, let's say there are 3 actors (4567, 4568, and 4569) with different properties:

* The first actor (id 4567) gets no targetability or death updates, but is present throughout the entire fight. This means you need a 'start' and 'end' parameter to clearly define the target's availability
* The second actor (id 4568) doesn't have parameters indicating that it is available to hit; however, it has death events
* The third actor (id 4569) just fires lasers, isn't targetable, but generally makes your analysis miserable.

There might be other actors, but we receive correct information from fflogs, so those aren't an issue, and shouldn't be provided in the configuration.

With that in mind, you could update the target's invulnerability windows in `Invulnerability.ts`:

```ts

import {
	Invulnerability as CoreInvulnerability,
	ActorsConfig,
} from 'parser/core/modules/Invulnerability'

export class Invulnerability extends CoreInvulnerability {
	protected actorConfig: ActorsConfig = {
		// Target 1 - no TAU or death events
		4567: {start: 'firstTap', end: 'overkill'},
		// Target 2 - no TAU, but provides death event(s)
		4568: {start: 'firstTap'},
		// Target 3 - can't target them
		4569: {exclude: true},
	}
}
```

# Testing

(Temporarily) modify `parser/core/modules/invulnerability.tsx` and set `static debug` to `true`. With your updates in place (or while tweaking your updates), the timeline should have an additional section indicating target(s) in various states. If the target doesn't show up and it needs to be there, add the actor ID and configure as appropriate. If the actor is already there but it's lingering or not showing up at the right time, also tweak these values.
