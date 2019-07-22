/**
 * @author Ririan
 */
import React from 'react'
import {Trans} from '@lingui/react'
import {t} from '@lingui/macro'
import {List} from 'semantic-ui-react'
import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'

// All of Bards DoTs
const DOTS = [
	STATUSES.CAUSTIC_BITE.id,
	STATUSES.STORMBITE.id,
	STATUSES.VENOMOUS_BITE.id,
	STATUSES.WINDBITE.id,
]

export default class Sidewinder extends Module {
	static handle = 'sidewinder'
	static title = t('brd.sidewinder.title')`Sidewinders and Shadowbites`
	static dependencies = [
		'suggestions',
	]

	_amountOfBadSidewinders = 0
	_amountOfBadShadowbites = 0

	_badCasts = []

	_enemies = {}

	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.SIDEWINDER.id, ACTIONS.SHADOWBITE.id],
		}, this._onSidewinderCast)

		this.addHook('applydebuff', {
			by: 'player',
			abilityId: DOTS,
		}, this._onApplyDot)

		this.addHook('removedebuff', {
			by: 'player',
			abilityId: DOTS,
		}, this._onRemoveDot)
		this.addHook('complete', this._onComplete)
	}

	_onSidewinderCast(event) {
		const enemyDots = this._getEnemyDots(event.targetID)
		const abilityId = event.ability.guid
		if (enemyDots.length < 2) {
			if (abilityId === ACTIONS.SIDEWINDER.id) {
				this._amountOfBadSidewinders++
			} else {
				this._amountOfBadShadowbites++
			}

			this._badCasts.push({abilityId: abilityId, dotsApplied: enemyDots.length, appliedDot: enemyDots[0], timestamp: event.timestamp})
		}
	}

	_onApplyDot(event) {
		const enemyDots = this._getEnemyDots(event.targetID)
		enemyDots.push(event.ability.guid)
	}

	_onRemoveDot(event) {
		const enemyDots = this._getEnemyDots(event.targetID)
		const dotIndex = this._findDot(enemyDots)
		if (dotIndex !== -1) {
			enemyDots.splice(dotIndex, 1)
		}
	}

	// Returns the enemy statuses state
	_getEnemyDots(targetId) {
		if (!this._enemies[targetId]) {
			this._enemies[targetId] = []
		}

		return this._enemies[targetId]
	}

	_findDot(array) {
		return array.findIndex(element => {
			for (const dot of DOTS) {
				if (element === dot) {
					return true
				}
			}
			return false
		})
	}

	_onComplete() {
		if (!this._badCasts.length) {
			return
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SIDEWINDER.icon,
			content: <Trans id="brd.sidewinder.suggestion">
			Only use <ActionLink {...ACTIONS.SIDEWINDER}/> and <ActionLink {...ACTIONS.SHADOWBITE}/> when you have both <ActionLink {...ACTIONS.CAUSTIC_BITE}/> and <ActionLink {...ACTIONS.STORMBITE}/> active on the target. Remember that a DoT doesn't apply as soon as you cast it, so you have to wait for it to apply before casting <ActionLink showIcon={false} {...ACTIONS.SIDEWINDER}/> or <ActionLink showIcon={false} {...ACTIONS.SHADOWBITE}/>.
			</Trans>,
			tiers: {
				5: SEVERITY.MAJOR,
				3: SEVERITY.MEDIUM,
				1: SEVERITY.MINOR,
			},
			value: this._amountOfBadSidewinders + this._amountOfBadShadowbites,
			why: <Trans id="brd.sidewinder.suggestion.reason">
				{this._amountOfBadSidewinders} casts of <ActionLink showIcon={false} {...ACTIONS.SIDEWINDER}/> and {this._amountOfBadShadowbites} casts of <ActionLink showIcon={false} {...ACTIONS.SHADOWBITE}/> without both DoTs applied.
			</Trans>,
		}))
	}

	output() {
		if (!this._badCasts.length) {
			return
		}
		// Builds a list item for each incorrect cast
		const items = this._badCasts.map(cast => {
			const ability = getDataBy(ACTIONS, 'id', cast.abilityId)
			if (cast.appliedDot) {
				return <List.Item key={cast.timestamp}>
					<List.Content>
						<Trans id="brd.sidewinder.list.one-dot">{this.parser.formatTimestamp(cast.timestamp)} - <ActionLink {...ability}/> was cast with only <StatusLink {...getDataBy(STATUSES, 'id', cast.appliedDot)}/> applied.</Trans>
					</List.Content>
				</List.Item>
			}
			return <List.Item key={cast.timestamp}>
				<List.Content>
					<Trans id="brd.sidewinder.list.no-dots">{this.parser.formatTimestamp(cast.timestamp)} - <ActionLink {...ability}/> was cast with no DoTs applied.</Trans>
				</List.Content>
			</List.Item>
		})
		// Output is a List, where every item is an incorrect cast
		return <List divided relaxed>
			{items}
		</List>
	}

}
