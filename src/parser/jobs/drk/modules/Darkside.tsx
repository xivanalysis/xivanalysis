import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import ACTIONS from 'data/ACTIONS'
import {Event} from 'legacyEvent'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Death from 'parser/core/modules/Death'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import React from 'react'
import {Table} from 'semantic-ui-react'

const DARKSIDE_MAX_DURATION = 60000
const DARKSIDE_EXTENSION = {
	[ACTIONS.FLOOD_OF_SHADOW.id]: 30000,
	[ACTIONS.EDGE_OF_SHADOW.id]: 30000,
}
const INITIAL_APPLICATION_FORGIVENESS = 2500

interface DarksideDrop {
	timestamp: number,
	reason: MessageDescriptor
}

export class Darkside extends Module {
	static handle = 'Darkside'

	static title = t('drk.darkside.title')`Darkside`
	@dependency private checklist!: Checklist
	@dependency private death!: Death

	private currentDuration = 0
	private downtime = 0
	private lastEventTime: number | null = null
	private darksideDrops: DarksideDrop[] = []

	protected init() {
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: Object.keys(DARKSIDE_EXTENSION).map(Number)}, this.updateDarkside)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('raise', {to: 'player'}, this.onRaise)
		this.addEventHook('complete', this.onComplete)
	}

	private updateDarkside(event: Event | NormalisedDamageEvent) {
		if (this.lastEventTime === null) {
			// First application - allow up to 1 GCD to apply before counting downtime
			const elapsedTime = event.timestamp - this.parser.fight.start_time
			this.downtime = Math.max(elapsedTime - INITIAL_APPLICATION_FORGIVENESS, 0)
		} else {
			const elapsedTime = event.timestamp - this.lastEventTime
			this.currentDuration -= elapsedTime
			if (this.currentDuration <= 0) {
				this.downtime += Math.abs(this.currentDuration)

				if (event.type !== 'death') {
					const droppedAt = event.timestamp + this.currentDuration
					this.darksideDrops.push({timestamp: droppedAt, reason: t('drk.darkside.drop.reason.timeout')`Timeout`})
				}

				this.currentDuration = 0
			}
		}

		if (event.type === 'normaliseddamage') {
			const abilityId = event.ability.guid
			this.currentDuration = Math.min(this.currentDuration + DARKSIDE_EXTENSION[abilityId], DARKSIDE_MAX_DURATION)
			this.lastEventTime = event.timestamp
		}
	}

	private onDeath(event: Event) {
		this.darksideDrops.push({timestamp: event.timestamp, reason: t('drk.darkside.drop.reason.death')`Death`})
		this.updateDarkside(event)
		this.currentDuration = 0
	}

	private onRaise(event: Event) {
		// So floor time doesn't count against Darkside uptime
		this.lastEventTime = event.timestamp
	}

	private onComplete(event: Event) {
		this.updateDarkside(event)
		const duration = this.parser.currentDuration - this.death.deadTime
		const uptime = ((duration - this.downtime) / duration) * 100
		this.checklist.add(new Rule({
			name: 'Keep Darkside up',
			description: <Trans id="drk.darkside.uptime.why">
				Darkside is gained by using <ActionLink {...ACTIONS.EDGE_OF_SHADOW}/> or <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/> and provides you with a 10% damage increase.  As such, it is a significant part of a DRK's personal DPS.  Do your best not to let it drop, and recover it as quickly as possible if it does.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="drk.darkside.uptime">Darkside Uptime</Trans>,
					percent: () => uptime,
				}),
			],
			target: 99,
		}))
	}

	output() {
		if (this.darksideDrops.length > 0) {
			return (
				<Table collapsing unstackable>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell><Trans id="drk.darkside.drop.at">Dropped Time</Trans></Table.HeaderCell>
							<Table.HeaderCell><Trans id="drk.darkside.drop.reason">Reason</Trans></Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{this.darksideDrops
							.map((d, idx) => {
								return <Table.Row key={`darksidedrop-${idx}`}>
									<Table.Cell>{this.parser.formatTimestamp(d.timestamp)}</Table.Cell>
									<Table.Cell><NormalisedMessage message={d.reason} id={Module.i18n_id}/></Table.Cell>
								</Table.Row>
							})
						}
					</Table.Body>
				</Table>
			)
		}
	}
}
