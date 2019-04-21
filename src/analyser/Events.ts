import {Events} from '@xivanalysis/parser-core'

// chosen by fair dice roll.
// guaranteed to be random.
const EVENT_PREFIX = 1024

let nextOffset = 0

interface EventTypeMeta<T extends Events.Base> {
	name: string,
	formatter?: (event: T) => string
}

export const eventMeta = new Map<Events.Base['type'], EventTypeMeta<Events.Base>>()

export function registerEvent<T extends Events.Base>(meta: EventTypeMeta<T>) {
	const id = EVENT_PREFIX + nextOffset++
	eventMeta.set(id, meta as any) // gotta love when interfaces aren't assignable to their parent
	return id
}
