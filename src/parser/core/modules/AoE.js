import Module from 'parser/core/Module'

// Blame Meishu. No touchy.
const INTERNAL_EVENT_TYPE = Symbol('aoe')

// Sequential damage events with more than this time diff (in ms) will be considered seperate damage pulses
// Consecutive staus events seem to have a longer sequential gap
// At the moment, 200ms threshold seems to parse it correctly
const DEFAULT_AOE_THRESHOLD = 20
const STATUS_AOE_THRESHOLD = 200

const SUPPORTED_EVENTS = [
	'refreshbuff',
	'applybuff',
]

export default class AoE extends Module {
	static handle = 'aoe'
	static dependencies = [
		// Need the precasts to fire first so we've got full info for the aoe calcs
		'precastAction', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'precastStatus', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'enemies',
		'fflogsEvents',
	]

	constructor(...args) {
		super(...args)
		// Listen to our own event from normalisation
		this.addHook(INTERNAL_EVENT_TYPE, this._onAoe)
	}

	// Need to normalise so the final events can go out at the right time
	normalise(events) {
		// Determine which name to use for damage and heal events (calculated vs normal)
		SUPPORTED_EVENTS.push(this.fflogsEvents.damageEventName, this.fflogsEvents.healEventName)

		// Track hits by source
		const trackers = {}
		function getTracker(event) {
			if (!event.ability) {
				return {}
			}

			if (!trackers[event.sourceID]) {
				trackers[event.sourceID] = {}
			}

			const source = trackers[event.sourceID]
			const abilityId = event.ability.guid

			return source[abilityId] = source[abilityId] || {
				events: {},
				insertAfter: 0,
				timestamp: null,
			}
		}

		const toAdd = []
		function addEvent(tracker) {
			// Set the timestamp to be the very first of all the events
			for (const eventType in tracker.events) {
				if (tracker.events[eventType].length !== 0) {
					tracker.timestamp = tracker.timestamp || tracker.events[eventType][0].timestamp
					tracker.timestamp = tracker.timestamp < tracker.events[eventType][0].timestamp ? tracker.timestamp : tracker.events[eventType][0].timestamp
				}
			}

			toAdd.push({
				...tracker,
				type: INTERNAL_EVENT_TYPE,
			})
		}

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			if (!SUPPORTED_EVENTS.includes(event.type)) {
				continue
			}

			const tracker = getTracker(event)

			// Get the timestamp of the last event
			let lastHitTimestamp = null
			if (Object.keys(tracker.events).length) {
				for (const eventType in tracker.events) {
					// compare all event groups for the absolute last hit
					const groupLastHit = tracker.events[eventType][tracker.events[eventType].length - 1]

					if (lastHitTimestamp < groupLastHit.timestamp) {
						lastHitTimestamp = groupLastHit.timestamp
					}
				}
			}

			// It seems to be that status events have a longer application gap
			const AOE_THRESHOLD = event.type === 'refreshbuff' || event.type === 'applybuff' ? STATUS_AOE_THRESHOLD : DEFAULT_AOE_THRESHOLD

			// If the last event was too long ago, generate an event
			if (lastHitTimestamp && event.timestamp - lastHitTimestamp > AOE_THRESHOLD) {
				addEvent(tracker)
				tracker.events = {}
				tracker.timestamp = null
			}

			// If this is the first event of it's type, make a new property for it
			if (!tracker.events[event.type]) {
				tracker.events[event.type] = []
			}

			event.i = i
			tracker.events[event.type].push(event)
			tracker.insertAfter = i
		}

		// Run a cleanup
		for (const sourceId in trackers) {
			for (const abilityId in trackers[sourceId]) {
				const tracker = trackers[sourceId][abilityId]

				let shouldCleanup = false

				for (const eventType in tracker.events) {
					if (tracker.events[eventType].length !== 0) {
						shouldCleanup = true
					}
				}
				if (shouldCleanup) {
					addEvent(tracker)
				}
			}
		}

		// Add all the events we gathered up in, in order
		let offset = 0
		toAdd.sort((a, b) => a.insertAfter - b.insertAfter).forEach(event => {
			events.splice(event.insertAfter + 1 + offset, 0, event)
			offset++
		})

		return events
	}

	_onAoe(event) {
		if (!Object.keys(event.events).length) { return }

		for (const eventType in event.events) {
			// Filter out any damage events that don't pass muster
			let hitsByTarget = event.events[eventType]
			if (eventType === 'damage') {
				hitsByTarget = hitsByTarget.filter(this.isValidHit.bind(this))
			}

			// Transform into a simplified format
			hitsByTarget = hitsByTarget.reduce((carry, event) => {
				const key = `${event.targetID}-${event.targetInstance}`
				if (carry[key]) {
					carry[key].times++
					carry[key].amount += event.amount
					carry[key].successfulHit = carry[key].successfulHit || event.successfulHit
				} else {
					carry[key] = {
						id: event.targetID,
						instance: event.targetInstance,
						times: 1,
						amount: event.amount,
						successfulHit: event.successfulHit,
					}
				}
				return carry
			}, {})

			const fabricatedEvent = {
				type: 'aoe' + eventType.replace('calculated', ''),
				timestamp: event.events[eventType][0].timestamp,
				ability: event.events[eventType][0].ability,
				hits: Object.values(hitsByTarget),
				sourceID: event.events[eventType][0].sourceID,
				amount: Object.values(hitsByTarget).reduce((total, hit) => total + hit.amount, 0),
				successfulHit: Object.values(hitsByTarget).reduce((successfulHit, hit) => successfulHit || hit.successfulHit, false),
			}
			if (event.events[eventType][0].hasOwnProperty('sourceResources')) {
				fabricatedEvent.sourceResources = event.events[eventType][0].sourceResources
			}
			this.parser.fabricateEvent(fabricatedEvent)
		}
	}

	isValidHit(event) {
		// Checking the event's target - if we get a falsey value back, it's an invalid target
		const validTarget = !!this.enemies.getEntity(event.targetID)

		// If there's an amount key but it's 0, it was likely a hit on an invuln target
		// Allow hits w/ overkill, as the fflogs algo for that shit is flakey
		const zeroAmount = event.amount === 0 && !event.overkill

		return validTarget && !zeroAmount
	}
}
