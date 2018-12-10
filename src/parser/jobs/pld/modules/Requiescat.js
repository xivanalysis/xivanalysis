import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

const TARGET = {
	HOLY_SPIRIT: {
		count: 5,
	},
}

const MODULE_SEVERITY = {
	MISSED_HOLY_SPIRITS: {
		1: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	},
	MISSED_BUFF_REQUIESCAT: {
		1: SEVERITY.MAJOR,
	},
}

const EXPECTED_MANA_TICK_AMOUNT = 141
const REQUIESCAT_MP_PERCENTAGE_THRESHOLD = 0.8

export default class Requiescat extends Module {
	static handle = 'requiescat'
	static dependencies = [
		'suggestions',
		'combatants',
	]

	static title = 'Requiescat Usage'

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.REQUIESCAT.id,
		}, this._onRemoveRequiescat)
		this.addHook('complete', this._onComplete)
	}

	// Internal State Counters
	_requiescatStart = null
	_holySpiritCount = 0

	// Result Counters
	_missedHolySpirits = 0
	_requiescatNoBuff = 0
	_requiescatRotations = {}

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.REQUIESCAT.id) {
			const {mp, maxMP} = this.combatants.selected.resources

			// We only track buff windows
			// Allow for inaccuracies of 1 MP Tick
			if ((mp + EXPECTED_MANA_TICK_AMOUNT) / maxMP >= REQUIESCAT_MP_PERCENTAGE_THRESHOLD) {
				this._requiescatStart = event.timestamp
			} else {
				this._requiescatNoBuff++
			}
		}

		if (this._requiescatStart !== null) {
			if (actionId === ACTIONS.HOLY_SPIRIT.id) {
				this._holySpiritCount++
			}

			if (!Array.isArray(this._requiescatRotations[this._requiescatStart])) {
				this._requiescatRotations[this._requiescatStart] = []
			}

			this._requiescatRotations[this._requiescatStart].push(event)
		}
	}

	_onRemoveRequiescat() {
		this._requiescatStart = null

		// Clamp to 0 since we can't miss negative
		this._missedHolySpirits += Math.max(0, TARGET.HOLY_SPIRIT.count - this._holySpiritCount)
		this._holySpiritCount = 0
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REQUIESCAT.icon,
			why: `${this._missedHolySpirits} Holy Spirit${this._missedHolySpirits !== 1 ? 's' : ''} missed during Requiescat.`,
			content: <Fragment>
				GCDs used during <ActionLink {...ACTIONS.REQUIESCAT}/> should be limited to <ActionLink {...ACTIONS.HOLY_SPIRIT}/> for optimal damage.
			</Fragment>,
			tiers: MODULE_SEVERITY.MISSED_HOLY_SPIRITS,
			value: this._missedHolySpirits,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REQUIESCAT.icon,
			why: `${this._requiescatNoBuff} Requiescat${this._requiescatNoBuff !== 1 ? 's' : ''} were used while under 80% MP.`,
			content: <Fragment>
				<ActionLink {...ACTIONS.REQUIESCAT}/> should only be used when over 80% MP. Try to not miss on the 20% Magic Damage buff it provides.
			</Fragment>,
			tiers: MODULE_SEVERITY.MISSED_BUFF_REQUIESCAT,
			value: this._requiescatNoBuff,
		}))
	}

	output() {
		const panels = Object.keys(this._requiescatRotations)
			.map(timestamp => {
				const holySpiritCount = this._requiescatRotations[timestamp]
					.filter(event => event.ability.guid === ACTIONS.HOLY_SPIRIT.id)
					.length

				return ({
					key: timestamp,
					title: {
						content: <Fragment>
							{this.parser.formatTimestamp(timestamp)}
							<span> - </span>
							<span>{holySpiritCount}/{TARGET.HOLY_SPIRIT.count} {ACTIONS.HOLY_SPIRIT.name}</span>
						</Fragment>,
					},
					content: {
						content: <Rotation events={this._requiescatRotations[timestamp]}/>,
					},
				})
			})

		return (
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		)
	}
}
