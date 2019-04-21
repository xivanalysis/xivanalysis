// chosen by fair dice roll.
// guaranteed to be random.
const EVENT_PREFIX = 1024

let nextOffset = 0

interface EventTypeMeta {
	name: string,
}

export const eventMeta = new Map<number, EventTypeMeta>()

export function registerEvent(meta: EventTypeMeta) {
	const id = EVENT_PREFIX + nextOffset++
	eventMeta.set(id, meta)
	return id
}
