/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const SS_DURATION = STATUSES.STRAIGHT_SHOT.duration * 1000 // 30s
const STRAIGHT_SHOT_THRESHOLD = 5000
const GCD_RECAST_FLOOR = 1500

const NONE = 0
const EARLY = 1
const WASTED = 2

export default class StraightShot extends Module {
	static handle = 'straightshot'
	static dependencies = [
		'combatants',
		'checklist',
		'downtime',
		'suggestions',
		'util',
	]

	_straightShotEvents = []

	constructor(...args) {
		super(...args)

		const buffFilter = {
			by: 'player',
			abilityId: STATUSES.STRAIGHT_SHOT.id,
		}

		const castFilter = {
			by: 'player',
			abilityId: ACTIONS.STRAIGHT_SHOT.id,
		}

		this.addHook('applybuff', buffFilter, this._onStraightShotApplication)
		this.addHook('refreshbuff', buffFilter, this._onStraightShotApplication)
		this.addHook('cast', castFilter, this._onStraightShotCast)
		this.addHook('complete', this._onComplete)

	}

	_onStraightShotApplication(event) {
		const ss = this._getStraightShotEvent()
		const previous = this._getStraightShotEvent(-1)

		if (!ss) {
			// What the fuck?
			return
		}

		// If there's a previous cast of Straight Shot that hasn't been applied, we attach this application to it
		if (!ss.isApplied) {
			ss.applicationEvent = event
		} else {
			// What the fuck?
			return
		}

		if (previous && previous.timeLeft(event.timestamp) > STRAIGHT_SHOT_THRESHOLD) {
			ss.issue |= EARLY
		}

	}

	_onStraightShotCast(event) {
		const ss = this._addStraightShotEvent(event)
		const id = STATUSES.STRAIGHTER_SHOT.id

		// If Straighter Shot was up when Straight Shot was used
		if (this.combatants.selected.hasStatus(id, event.timestamp, GCD_RECAST_FLOOR)) {
			ss.issue |= WASTED
		}
	}

	_onComplete() {
		// Let's ignore early casts that are used for transitional purposes or to not fall inside RS
		this._cleanUpEarlyShots()

		const earlyRefreshes = this._straightShotEvents.filter(x => x.issue & EARLY)
		const wastedShots = this._straightShotEvents.filter(x => x.issue & WASTED)

		this.checklist.add(new Rule({
			name: 'Keep Straight Shot up',
			description: 'Straight Shot is a 10% critical hit rate buff that should be up at all times.',
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.STRAIGHT_SHOT} /> uptime</Fragment>,
					percent: () => this.util.getBuffUptime(STATUSES.STRAIGHT_SHOT),
				}),
			],
		}))

		if (earlyRefreshes.length) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.STRAIGHT_SHOT.icon,
				content: <Fragment>
					{ACTIONS.STRAIGHT_SHOT.name} should ideally be refreshed with {STRAIGHT_SHOT_THRESHOLD / 1000} seconds or less left on the effect. More {ACTIONS.STRAIGHT_SHOT.name} casts than necessary mean less <ActionLink {...ACTIONS.HEAVY_SHOT} /> casts, which in turn mean a lower <ActionLink {...ACTIONS.REFULGENT_ARROW} /> chance.
				</Fragment>,
				tiers: {
					10: SEVERITY.MAJOR,
					5: SEVERITY.MEDIUM,
					1: SEVERITY.MINOR,
				},
				value: earlyRefreshes.length,
				why: <Fragment>
					{earlyRefreshes.length} {earlyRefreshes.length === 1 ? 'cast' : 'casts'} with more than {STRAIGHT_SHOT_THRESHOLD / 1000} seconds left on <StatusLink {...STATUSES.STRAIGHT_SHOT} />.
				</Fragment>,
			}))
		}

		if (wastedShots.length) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.STRAIGHT_SHOT.icon,
				content: <Fragment>
					Using {ACTIONS.STRAIGHT_SHOT.name} when you have a <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> proc available consumes it. <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> procs should all be used on <ActionLink {...ACTIONS.REFULGENT_ARROW} /> casts.
				</Fragment>,
				tiers: {
					2: SEVERITY.MAJOR,
					1: SEVERITY.MEDIUM,
				},
				value: wastedShots.length,
				why: <Fragment>
					{wastedShots.length} instances of <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> procs being used on {ACTIONS.STRAIGHT_SHOT.name} casts.
				</Fragment>,
			}))
		}
	}

	_getStraightShotEvent(previous) {
		let index = this._straightShotEvents.length - 1

		if (previous) {
			index += previous
		}

		if (index < 0) {
			return undefined
		}

		return this._straightShotEvents[index]
	}

	_addStraightShotEvent(event) {
		const ss = {
			castEvent: event,
			applicationEvent: undefined,
			issue: NONE,
			get timestamp() {
				return this.applicationEvent && this.applicationEvent.timestamp
			},
			get isApplied() {
				return this.applicationEvent !== undefined
			},
			timeLeft(timestamp) {
				return this.isApplied
					&& this.applicationEvent.timestamp
					&& Math.max((SS_DURATION) - (timestamp - this.applicationEvent.timestamp), 0)
					|| 0
			},
		}

		this._straightShotEvents.push(ss)

		return ss
	}

	_cleanUpEarlyShots() {
		const ssEvents = this._straightShotEvents

		for (let i = 1 ; i < ssEvents.length; i++) {
			const ss = ssEvents[i]
			const previous = ssEvents[i-1]
			// If the previous SS refresh was gonna fall inside RS
			// or if the previous SS refresh was gonna fall inside a downtime window AND this early refresh prevented it from doing so
			// we let it pass :blobglare:
			if (
				this.combatants.selected.hasStatus(STATUSES.RAGING_STRIKES.id, previous.timestamp + SS_DURATION)
				|| this.downtime.isDowntime(previous.timestamp + SS_DURATION)
				&& !this.downtime.isDowntime(ss.timestamp + SS_DURATION)
			) {
				ss.issue &= ~EARLY
			}
		}
	}

}
