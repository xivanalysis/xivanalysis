import {BaseEventFields} from 'fflogs'
import Module from 'parser/core/Module'

export const BLM_GAUGE_EVENT: unique symbol

interface BLMGaugeEvent extends BaseEventFields {
	type: typeof BLM_GAUGE_EVENT,
	timestamp: number,
	insertAfter: number,
	astralFire: number,
	umbralIce: number,
	umbralHearts: number,
	enochian: boolean,
	polyglot: number,
	lastGaugeEvent: BLMGaugeEvent,
}

declare module 'events' {
	interface EventTypeRepository {
		blmRotationWatchdog: BLMGaugeEvent
	}
}

export default class Gauge extends Module {
	// There's some unprefixed stuff here, but it doesn't look like public API surface
	// If you need something and it's missing, that's probably my bad. Just add it.
}
