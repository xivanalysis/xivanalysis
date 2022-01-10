# Patch checklist

***This document is a work in progress.***
{: .admonition .danger}

So Square Enix just released a patch for XIV, and now you're trying to update XIVA for it? This document provides a list of some things to do, or keep an eye out for, in the process.

Some patches will require more work and changes than others - to facilitate, the notes below have been broken up into a few overarching categories, based on the approximate magnitude of a patch they apply to. Despite this, it's recommended that you read through all of it - just in case. Who knows what curve balls they might've thrown our way.

## `X.X_` Minor patches

### Verify invulnerability windows for new content

While most bosses are served well by the default invulnerability checks, some bosses (especially door bosses and similar) do not. Check a few logs for each new boss in a local build, with `src/parser/core/modules/Invulerability.ts`'s `debug` enabled. The timeline will contain a readout of all the invunerability windows it has detected (if any).

If any seem incorrect - i.e. enemies remaining targetable after death, or being targetable before they spawned, [add an encounter-specific `invulnerability` override](#adding-encounter-overrides) with fixed actor configuration.

## `X._0` Major patches

## `_.00` Expansions

### Update the speed attribute constants

They can be found in in `src/utilities/speedStatMapper.ts` as `SUB_ATTRIBUTE_MINIMUM` and `STAT_DIVISOR`. These two constants form a key part in calculations for converting speed attribute values into cast times and visa versa. The correct values can be found in the `ParamGrow` sheet in the game's data.

Make sure to sanity check the function results, as the underlying algorithm may have changed. If it has, contact Allagan Studies for updated formulas.

---

## Adding encounter overrides

While we generally avoid adding per-boss handling, as it generates increased maintenance burden for the site as a whole, some modules such as `invulnerability` can't account for all possible variations, and occasionally need to be configured.

To start, you'll need to add an entry to `src/data/ENCOUNTERS` for the boss - don't feel the need to populate it with _every_ new boss, only the ones we're explicitly adding overrides for. Use community shorthand for the keys, i.e. `P1S` for Erichthonios.

For each report source you have to provide, you can typically find the requisite ID as follows:

|Report source|ID location|
|--|--|
|`legacyFflogs`|`report.fights[].boss`|

Once that's added, you'll need to add the parser scaffold for the encounter. In the parser structure, encounter overrides are much the same as jobs, and as such share much of the same file layout:

```
src/parser/bosses/
└ <encounter key in lower case>/
	├ index.tsx
	└ modules/
		└ index.ts
```

```ts
// src/parser/bosses/<encounter>/index.tsx
import {Meta} from 'parser/core/Meta'

export const ENCOUNTER_KEY_HERE = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-<encounter>" */),
})
```

```ts
// src/parser/bosses/<encounter>/modules/index.tsx
export default [
	// Add modules here...
]
```

From this point, modules can be added akin to any other module override in job folders.
