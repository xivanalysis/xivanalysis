# Patch checklist

***This document is a work in progress.***
{: .admonition .danger}

So Square Enix just released a patch for XIV, and now you're trying to update XIVA for it? This document provides a list of some things to do, or keep an eye out for, in the process.

Some patches will require more work and changes than others - to facilitate, the notes below have been broken up into a few overarching categories, based on the approximate magnitude of a patch they apply to. Despite this, it's recommended that you read through all of it - just in case. Who knows what curve balls they might've thrown our way.

## `X.X_` Minor patches

## `X._0` Major patches

## `_.00` Expansions

- Update the speed attribute constants in `src/utilities/speedStatMapper.ts`. These two constants, `SUB_ATTRIBUTE_MINIMUM` and `STAT_DIVISOR`, form a key part in calculations for converting speed attribute values into cast times and visa versa. The correct values can be found in the `ParamGrow` sheet in the game's data. <br/>
Make sure to sanity check the function results, as the underlying algorithm may have changed. If it has, contact Allagan Studies for updated formulas.
