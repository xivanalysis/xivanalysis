import {t} from '@lingui/macro'
import {Ability,  DamageEvent} from 'fflogs'
import _ from 'lodash'
import Enemy from 'parser/core/Enemy'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import Enemies from 'parser/core/modules/Enemies'
import Timeline, {Item, ItemGroup} from 'parser/core/modules/Timeline'
import React from 'react'
import {Table} from 'semantic-ui-react'
import {formatDuration} from 'utilities'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import MultiStatuses from './multi/MultiStatuses'

// Enemy attacks

// LL Auto attack
// type: 'cast'
// ability.guid: 18808

// TODO: Do something with the per player damage events

export default class EnemyAttacks extends Module {
	static handle = 'enemyAttacks'
	static displayOrder = DISPLAY_ORDER.ENEMY_ATTACKS
	static displayMode = DISPLAY_MODE.FULL
	static title = t('teatime.enemyattacks.title')`Enemy Attacks`

	@dependency private timeline!: Timeline
	@dependency private enemies!: Enemies
	@dependency private multiStatuses!: MultiStatuses

	private damageEvents: DamageEvent[] = []
	private targetDamageEvents: {[key: number]: DamageEvent[]} = {}

	protected init() {
		this.addHook('damage', {sourceIsFriendly: false}, this.onDamage)

		this.addHook('complete', this._onComplete)
	}

	private onDamage(event: DamageEvent) {
		this.damageEvents.push(event)
		if (!_.isNil(event.targetID)) {
			if (!this.targetDamageEvents[event.targetID]) {
				this.targetDamageEvents[event.targetID] = []
			}
			this.targetDamageEvents[event.targetID].push(event)
		}
	}

	private _fixAbilityName(ability: Ability): string {
		// TODO: This is TEA specific data
		const ABILITY_NAMES: {[key: number]: string} = {
			18808 : 'Auto Attack', // LL
			18809 : 'Auto Attack', // HAND
			19278 : 'Auto Attack', // Jagd Doll
		}
		return ability.name || ABILITY_NAMES[ability.guid] || `${ability.guid}`
	}

	private _onComplete() {
		const startTime = this.parser.fight.start_time

		for (const event of this.damageEvents) {
			const abilityName = this._fixAbilityName(event.ability)
			this.timeline.addItem(new Item({
				type: 'point',
				group: event.targetID,
				// style: 'background-color: #ce909085;',
				start: event.timestamp - startTime,
				// end: event.timestamp - startTime,
				title: abilityName,
			}))
		}
	}

	private _damageCell(damageEvent: DamageEvent): React.ReactNode {
		// name(sourceID)
		// ability.name
		// amount
		// overkill
		// absorbed)
		const entity: Enemy | undefined = this.enemies.getEntity(damageEvent.sourceID)
		if (!entity) {
			return
		}
		if (!damageEvent.targetID) {
			return
		}
		const sourceName = entity.name
		const abilityName = damageEvent.ability.name
		// damageEvent.overkill
		const amount = damageEvent.amount + damageEvent.absorbed
		const sourceStatuses = this.multiStatuses.getStatuses(entity.id, damageEvent.timestamp)
		const sourceStatusIcons = sourceStatuses.map((status, i) => (
			<img key={i} src={status.icon} alt={status.name}/>
		))
		const targetStatuses = this.multiStatuses.getStatuses(damageEvent.targetID, damageEvent.timestamp)
		const targetStatusIcons = targetStatuses.map((status, i) => (
			<img key={i} src={status.icon} alt={status.name}/>
		))
		return <>
			{sourceName}{sourceStatusIcons}:<strong>{abilityName}</strong> ({amount}) {targetStatusIcons}
		</>
	}

	output(): React.ReactNode {
		// KC: Translation
		const startTime = this.parser.fight.start_time
		return <Table compact unstackable celled>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong>Time</strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong>Attack</strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
			{
				this.targetDamageEvents[this.parser.player.id].map((damageEvent, i) =>
					<Table.Row key={i}>
						<Table.Cell textAlign="center">
							<span style={{marginRight: 5}}>{formatDuration((damageEvent.timestamp - startTime) / 1000)}</span>
						</Table.Cell>
						<Table.Cell>
							{this._damageCell(damageEvent)}
						</Table.Cell>
					</Table.Row>,
				)
			}
			</Table.Body>
		</Table>
	}
}
