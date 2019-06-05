import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Table} from 'semantic-ui-react'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const UNDESIRABLES = [
	ACTIONS.EARTH_TACKLE.id,
	ACTIONS.ONE_ILM_PUNCH.id,
]

export default class Undesirables extends Module {
	static handle = 'undesirables'
	static dependencies = [
		'suggestions',
	]

	static title = t('mnk.undesirables.title')`Undesirable Skills`
	static displayOrder = DISPLAY_ORDER.UNDESIRABLES

	_undesirables = []

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player', abilityId: UNDESIRABLES}, this._onBad)
		this.addHook('complete', this._onComplete)
	}

	_onBad(event) {
		const actionId = event.ability.guid

		// WTF but always worth checking
		if (!actionId) {
			return
		}

		this._undesirables.push({id: actionId, timestamp: event.timestamp})
	}

	_onComplete() {
		const oneIlmPunchCount = this._undesirables.filter(event => event.id === ACTIONS.ONE_ILM_PUNCH.id).length
		const earthTackleCount = this._undesirables.filter(event => event.id === ACTIONS.EARTH_TACKLE.id).length
		const lostTacklePotency = earthTackleCount * (ACTIONS.FIRE_TACKLE.potency - ACTIONS.EARTH_TACKLE.potency)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.EARTH_TACKLE.icon,
			content: <Trans id="mnk.undesirables.suggestions.earthtackle.content">
				Avoid using <ActionLink {...ACTIONS.EARTH_TACKLE} /> as you're losing uses of the higher potency <ActionLink {...ACTIONS.FIRE_TACKLE} />.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: earthTackleCount,
			why: <Trans id="mnk.undesirables.suggestions.earthtackle.why">
				{lostTacklePotency} potency lost to inefficient tackling.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.ONE_ILM_PUNCH.icon,
			content: <Trans id="mnk.undesirables.suggestions.oneilm.content">
				Avoid using <ActionLink {...ACTIONS.ONE_ILM_PUNCH} /> as you're losing uses of the higher potency <ActionLink {...ACTIONS.TRUE_STRIKE} /> and <ActionLink {...ACTIONS.TWIN_SNAKES} />.
			</Trans>,
			tiers: {
				1: SEVERITY.MAJOR,
			},
			value: oneIlmPunchCount,
			why: <Trans id="mnk.undesirables.suggestions.oneilm.why">
				<ActionLink {...ACTIONS.ONE_ILM_PUNCH} /> cost <Plural value={oneIlmPunchCount} one="# more potent GCD" other="# more potent GCDs" />.
			</Trans>,
		}))
	}

	output() {
		if (!this._undesirables.length > 0) {
			return false
		}

		return <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="mnk.undesirables.table.header.skill">Skill</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="mnk.undesirables.table.header.time">Time</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this._undesirables.map(bad => {
					return <Table.Row key={bad.timestamp}>
						<Table.Cell><ActionLink {...getDataBy(ACTIONS, 'id', bad.id)} /></Table.Cell>
						<Table.Cell>{this.parser.formatTimestamp(bad.timestamp)}</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}
}
