/*
Welcome to the *｡･ﾟ★｡ magic ☆ﾟ･｡° events file!
You're probably here to add your new fabricated event to the event type!
Don't. I'm a big meanie and _will_ block your PR.

Instead, you'll want to set it up from your module file, using declaration merging
(https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
It'll look something like this:
```ts
declare module 'events' {
	interface EventTypeRepository {
		yourModuleHandle: UnionOf | YourFabricated | EventTypes
	}
}
```

Doing the above will automatically merge it into the `Event` type exported below,
making it available and discoverable throughout the rest of the parser.
*/

/**
 * Declaration merge target. You don't want to use this directly unless you are
 * declaring a new type of event. If you're importing this, you're doing it wrong.
 */
// tslint:disable-next-line no-empty-interface
export interface EventTypeRepository {}

/*
The below is a collection of types used to create a "backfilled" union - that is, a
union of types where all _invalid_ keys that are defined elsewhere in the union are
typed as `?:never`, allowing us to discriminate on any possible union property.
With thanks to https://github.com/microsoft/TypeScript/issues/20863#issuecomment-520551758
*/

// For a given union U, return all possible keys available on members
type UnionKeys<U> = U extends unknown ? keyof U : never

// For the union of keys K, return an object type with each member optionally typed to never
type InvalidKeys<K extends string | number | symbol> = { [P in K]?: never }

// For each member of union U, add all _other_ possible keys available within U as InvalidKeys
type BackfillUnionInternal<U, UAll> =
	U extends unknown
		? U & InvalidKeys<Exclude<UnionKeys<UAll>, keyof U>>
		: never

// Helper type used to duplicate the union U for use in the type above
type BackfillUnion<U> = BackfillUnionInternal<U, U>

/** Union of every event type declared in the application */
export type Event = BackfillUnion<EventTypeRepository[keyof EventTypeRepository]>
