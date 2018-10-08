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

const STRAIGHT_SHOT_THRESHOLD = 5000
const GCD_RECAST_FLOOR = 1500

export default class StraightShot extends Module {
	static handle = 'straightshot'
	static dependencies = [
		'combatants',
		'checklist',
		'suggestions',
		'util',
	]

	_lastStraightShot
	_earlyStraightShotCasts = []
	_wastedStraighterShots = []

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
		const lastApplication = this._lastStraightShot

		// If there's a previous cast of Straight Shot, checks for early casts
		if (lastApplication) {
			if (this._getTimeLeftOnStraightShot(event.timestamp) > STRAIGHT_SHOT_THRESHOLD) {
				// TODO: Check if the Straight Shot was used early for transitional purposes
				// TODO: Check if the Straight Shot was used to prevent it from falling inside Raging Strikes
				this._earlyStraightShotCasts.push(event)
			}
		}
		this._lastStraightShot = event

	}

	_onStraightShotCast(event) {
		const id = STATUSES.STRAIGHTER_SHOT.id

		// If Straighter Shot was up when Straight Shot was used
		if (this.combatants.selected.hasStatus(id, event.timestamp, GCD_RECAST_FLOOR)) {
			this._wastedStraighterShots.push(event)
		}
	}

	_onComplete() {

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

		if (this._earlyStraightShotCasts.length) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.STRAIGHT_SHOT.icon,
				content: <Fragment>
					{ACTIONS.STRAIGHT_SHOT.name} should ideally be refreshed with {STRAIGHT_SHOT_THRESHOLD / 1000} seconds or less left on the effect. More {ACTIONS.STRAIGHT_SHOT.name} casts than necessary mean less <ActionLink {...ACTIONS.HEAVY_SHOT} /> casts, which in turn mean a lower <ActionLink {...ACTIONS.REFULGENT_ARROW} /> chance.
				</Fragment>,
				tiers: {
					5: SEVERITY.MAJOR,
					3: SEVERITY.MEDIUM,
					1: SEVERITY.MINOR,
				},
				value: this._earlyStraightShotCasts.length,
				why: <Fragment>
					{this._earlyStraightShotCasts.length} {this._earlyStraightShotCasts.length === 1 ? 'cast' : 'casts'} with more than {STRAIGHT_SHOT_THRESHOLD / 1000} seconds left on <StatusLink {...STATUSES.STRAIGHT_SHOT} />.
				</Fragment>,
			}))
		}

		if (this._wastedStraighterShots.length) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.STRAIGHT_SHOT.icon,
				content: <Fragment>
					Using {ACTIONS.STRAIGHT_SHOT.name} when you have a <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> proc available consumes it. <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> procs should all be used on <ActionLink {...ACTIONS.REFULGENT_ARROW} /> casts.
				</Fragment>,
				tiers: {
					2: SEVERITY.MAJOR,
					1: SEVERITY.MEDIUM,
				},
				value: this._wastedStraighterShots.length,
				why: <Fragment>
					{this._wastedStraighterShots.length} instances of <StatusLink {...STATUSES.STRAIGHTER_SHOT} /> procs being used on {ACTIONS.STRAIGHT_SHOT.name} casts.
				</Fragment>,
			}))
		}
	}

	_getTimeLeftOnStraightShot(timestamp) {
		return Math.max(STATUSES.STRAIGHT_SHOT.duration * 1000 + this._lastStraightShot.timestamp - timestamp, 0)
	}

}
