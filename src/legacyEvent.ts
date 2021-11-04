/*
Welcome to the *｡･ﾟ★｡ magic ☆ﾟ･｡° legacyEvent file!
You're probably here to add your new fabricated event to the event type!
Don't. I'm a big meanie and _will_ block your PR.

Instead, you'll want to set it up from your module file, using declaration merging
(https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
It'll look something like this:
```ts
declare module 'legacyEvent' {
	interface EventTypeRepository {
		yourModuleHandle: UnionOf | YourFabricated | EventTypes
	}
}
```

Doing the above will automatically merge it into the `Event` type exported below,
making it available and discoverable throughout the rest of the parser.
*/

import {BackfillUnion} from 'utilities'

/**
 * Declaration merge target. You don't want to use this directly unless you are
 * declaring a new type of event. If you're importing this, you're doing it wrong.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventTypeRepository {}

/** Union of every event type declared in the application */
export type Event = BackfillUnion<EventTypeRepository[keyof EventTypeRepository]>
