import {Event, Events} from 'event'

type EventFormatter<E extends Event> = (event: E) => React.ReactNode
export const eventFormatters = new Map<string, EventFormatter<Event>>()

/** DOCS */
export function registerEventFormatter<T extends keyof Events>(type: T, formatter: EventFormatter<Events[T]>) {
	eventFormatters.set(type, formatter as EventFormatter<Event>)
}

// -----
// #region Stock event formatters
// -----

// registerEventFormatter('snapshot', event => 'SNAPSHOT')

// -----
// #endregion
// -----
