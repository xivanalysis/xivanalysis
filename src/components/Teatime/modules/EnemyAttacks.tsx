import {t} from '@lingui/macro'
import {NumberFormat} from '@lingui/react'
import _ from 'lodash'
import React from 'react'
import {Table} from 'semantic-ui-react'

import {Status} from 'data/STATUSES'
import {Ability,  DamageEvent} from 'fflogs'
import Enemy from 'parser/core/Enemy'
import Module, {dependency, DISPLAY_MODE} from 'parser/core/Module'
import Enemies from 'parser/core/modules/Enemies'
import Timeline, {Item, ItemGroup} from 'parser/core/modules/Timeline'
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

	private fixAbilityName(ability: Ability): string {
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
			const abilityName = this.fixAbilityName(event.ability)
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

	private sourceCell(entity: Enemy, sourceStatuses: Status[], damageEvent: DamageEvent): React.ReactNode {
		const sourceName = entity.name
		const sourceStatusIcons = sourceStatuses.map((status, i) => (
			<img key={i} src={status.icon} alt={status.name} title={status.name}/>
		))

		return <>
			<div>
				{sourceName}
			</div>
			<div>
				{sourceStatusIcons}
			</div>
		</>
	}

	private attackCell(targetStatuses: Status[], damageEvent: DamageEvent): React.ReactNode {
		const abilityName = this.fixAbilityName(damageEvent.ability)

		const targetStatusIcons = targetStatuses.map((status, i) => (
			<img key={i} src={status.icon} alt={status.name} title={status.name}/>
		))
		return <>
			<div>
				{abilityName}
			</div>
			<div>
				{targetStatusIcons}
			</div>
		</>
	}

	private damageCell(damageEvent: DamageEvent): React.ReactNode {
		this.debug(damageEvent)

		return <NumberFormat value={damageEvent.amount} />
	}

	private attackRow(damageEvent: DamageEvent, index: number): React.ReactNode {
		if (!damageEvent.targetID) {
			return
		}
		const entity: Enemy | undefined = this.enemies.getEntity(damageEvent.sourceID)
		if (!entity) {
			return
		}
		const sourceStatuses = this.multiStatuses.getStatuses(entity.id, damageEvent.timestamp)
		const targetStatuses = this.multiStatuses.getStatuses(damageEvent.targetID, damageEvent.timestamp)

		return <Table.Row key={index}>
			<Table.Cell textAlign="center">
				<span style={{marginRight: 5}}>{this.parser.formatTimestamp(damageEvent.timestamp)}</span>
			</Table.Cell>
			<Table.Cell>
				{this.sourceCell(entity, sourceStatuses, damageEvent)}
			</Table.Cell>
			<Table.Cell textAlign="right">
				{this.damageCell(damageEvent)}
			</Table.Cell>
			<Table.Cell>
				{this.attackCell(targetStatuses, damageEvent)}
			</Table.Cell>
		</Table.Row>
	}

	output(): React.ReactNode {
		// KC: Translation
		return <Table compact unstackable collapsing>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong>Time</strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong>Source</strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong>Damage</strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong>Attack</strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
			{
				this.targetDamageEvents[this.parser.player.id].map((damageEvent, i) =>
					this.attackRow(damageEvent, i),
				)
			}
			</Table.Body>
		</Table>
	}
}
