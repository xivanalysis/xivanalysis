/*
* this module differs from defensives because these ones are only active after an ability has been prepped.
* e.g. Sun Sign requires Neutral Sect
*/

import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, DataLink, StatusLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {ReactNode} from 'react'
import {Accordion, Button, Table} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const DEFENSIVE_USE_WINDOW = 20 //this is used since the defensive cooldown isn't necessarily displayed due to it relating to an underlying status or action

interface Window {
	openTimestamp: number,
	closeTimestamp?: number,
	isUsed?: boolean,
}

interface DefensivesMetadata {
	defensive: Action,
	prerequisiteAction?: Action,
	cancellingAction?: Action,
	prerequisiteStatus?: Status,
	displayAction?: Action, //used to display neutral sect or another ability since tracking more than one causes duplicate lines
	history: Window[],
}

interface ActiveDefensives {
	defensiveID: Action,
	openTimestamp: number,
}

export class DroppedDefensives extends Analyser {
	static override handle = 'droppedDefensives'
	static override title = t('ast.dropped-defensives.title')`Dropped Defensives`
	static override displayOrder = DISPLAY_ORDER.DROPPED_DEFENSIVES

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private activeDefensives: ActiveDefensives[] = [ //starts as if astral was drawn
		{
			defensiveID: this.data.actions.THE_ARROW,
			openTimestamp: this.parser.pull.timestamp,
		},
		{
			defensiveID: this.data.actions.THE_SPIRE,
			openTimestamp: this.parser.pull.timestamp,
		},
	]
	private defensivesHistory: DefensivesMetadata[] = [
		{
			defensive: this.data.actions.SUN_SIGN,
			prerequisiteStatus: this.data.statuses.SUN_TOUCHED,
			displayAction: this.data.actions.NEUTRAL_SECT,
			history: [],
		},
		{
			defensive: this.data.actions.THE_ARROW,
			prerequisiteAction: this.data.actions.ASTRAL_DRAW,
			cancellingAction: this.data.actions.UMBRAL_DRAW,
			history: [],
		},
		{
			defensive: this.data.actions.THE_SPIRE,
			prerequisiteAction: this.data.actions.ASTRAL_DRAW,
			cancellingAction: this.data.actions.UMBRAL_DRAW,
			history: [],
		},
		{
			defensive: this.data.actions.THE_BOLE,
			prerequisiteAction: this.data.actions.UMBRAL_DRAW,
			cancellingAction: this.data.actions.ASTRAL_DRAW,
			history: [],
		},
		{
			defensive: this.data.actions.THE_EWER,
			prerequisiteAction: this.data.actions.UMBRAL_DRAW,
			cancellingAction: this.data.actions.ASTRAL_DRAW,
			history: [],
		},
		{
			defensive: this.data.actions.LADY_OF_CROWNS,
			prerequisiteAction: this.data.actions.UMBRAL_DRAW,
			cancellingAction: this.data.actions.ASTRAL_DRAW,
			history: [],
		},
	]

	override initialise() {

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const defensives: Array<Action['id']> = this.defensivesHistory
			.flatMap(defensiveItem => defensiveItem.defensive.id)
		const prerequisiteActions: Array<Action['id']> = this.defensivesHistory
			.flatMap(defensiveItem => defensiveItem.prerequisiteAction?.id ?? [])
		const cancellingActions: Array<Action['id']> = this.defensivesHistory
			.flatMap(defensiveItem => defensiveItem.cancellingAction?.id ?? [])
		const prerequisiteStatuses: Array<Status['id']> = this.defensivesHistory
			.flatMap(defensiveItem => defensiveItem.prerequisiteStatus?.id ?? [])

		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(defensives))
		, this.onDefensiveUsed)
		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(prerequisiteActions))
		, this.onDefensiveOpen)
		this.addEventHook(playerFilter
			.type('action')
			.action(oneOf(cancellingActions))
		, this.onDefensiveClose)
		this.addEventHook(playerFilter
			.type('statusApply')
			.status(oneOf(prerequisiteStatuses))
		, this.onDefensiveOpen)
		this.addEventHook(playerFilter
			.type('statusRemove')
			.status(oneOf(prerequisiteStatuses))
		, this.onDefensiveClose)
	}

	private onDefensiveOpen(event: Events['action'] | Events['statusApply']) {
		const applicableDefensives = this.defensivesHistory
			.filter(defensiveItem =>
				(event.type === 'action' && defensiveItem.prerequisiteAction != null && defensiveItem.prerequisiteAction.id === event.action)
				|| (event.type === 'statusApply' && defensiveItem.prerequisiteStatus != null && defensiveItem.prerequisiteStatus.id === event.status))

		applicableDefensives.forEach(defensiveItem => {
			this.activeDefensives.push({
				defensiveID: defensiveItem.defensive,
				openTimestamp: event.timestamp,
			})
		})
	}

	private onDefensiveClose(event: Events['action'] | Events['statusRemove']) {
		const applicableDefensives = this.defensivesHistory
			.filter(defensiveItem =>
				(event.type === 'action' && defensiveItem.cancellingAction != null && defensiveItem.cancellingAction.id === event.action)
				|| (event.type === 'statusRemove' && defensiveItem.prerequisiteStatus != null && defensiveItem.prerequisiteStatus.id === event.status))

		applicableDefensives.forEach(currentDefensiveItem => {
			const departingDefensives: ActiveDefensives[] =
				this.activeDefensives.filter(defensiveItem => currentDefensiveItem.defensive === defensiveItem.defensiveID)
			departingDefensives.forEach(departingDefensive =>
				this.defensivesHistory
					.filter(defensiveItem => defensiveItem.defensive === departingDefensive.defensiveID)[0].history
					.push({
						openTimestamp: departingDefensive.openTimestamp,
						closeTimestamp: event.timestamp,
						isUsed: false,
					})
			)
			this.activeDefensives = this.activeDefensives.filter(defensiveItem => currentDefensiveItem.defensive !== defensiveItem.defensiveID)
		})
	}

	private onDefensiveUsed(event: Events['action']) {
		const applicableDefensives = this.defensivesHistory
			.filter(defensiveItem => defensiveItem.defensive.id === event.action)

		applicableDefensives.forEach(currentDefensiveItem => {
			const departingDefensives: ActiveDefensives[] =
				this.activeDefensives.filter(defensiveItem => currentDefensiveItem.defensive === defensiveItem.defensiveID)
			departingDefensives.forEach(departingDefensive =>
				this.defensivesHistory
					.filter(defensiveItem => defensiveItem.defensive === departingDefensive.defensiveID)[0].history
					.push({
						openTimestamp: departingDefensive.openTimestamp,
						closeTimestamp: event.timestamp,
						isUsed: true,
					})
			)
			this.activeDefensives = this.activeDefensives.filter(defensiveItem => currentDefensiveItem.defensive !== defensiveItem.defensiveID)
		})
	}

	private returnRow(history: Window): ReactNode {
		const availableTimestamp: number = history.openTimestamp
		const endingTimestamp: number = history.closeTimestamp ?? (this.parser.pull.duration + this.parser.pull.timestamp)
		if (history.isUsed) {
			return <Table.Row><Table.Cell>
				<Trans id="ast.dropped-defensives.action.used">Used at <Button
					circular
					compact
					size="mini"
					icon="time"onClick={() => this.timeline.show(endingTimestamp - this.parser.pull.timestamp, endingTimestamp - this.parser.pull.timestamp + DEFENSIVE_USE_WINDOW)}>
				</Button> {this.parser.formatEpochTimestamp(endingTimestamp)}
				</Trans>
			</Table.Cell>
			</Table.Row>
		}
		return <Table.Row><Table.Cell>
			<Trans id="ast.dropped-defensives.action.unused">Available to use between <Button
				circular
				compact
				size="mini"
				icon="time"onClick={() => this.timeline.show(availableTimestamp - this.parser.pull.timestamp, endingTimestamp - this.parser.pull.timestamp)}>
			</Button> {this.parser.formatEpochTimestamp(availableTimestamp)} and {this.parser.formatEpochTimestamp(endingTimestamp)}
			</Trans>
		</Table.Cell>
		</Table.Row>

	}

	private returnHeader(defensive: DefensivesMetadata, index: number): ReactNode {
		const actionStatusDependency =
			<><ActionLink key={defensive.prerequisiteAction?.id} {...defensive.prerequisiteAction} /><StatusLink key={defensive.prerequisiteStatus?.id} {...defensive.prerequisiteStatus} /><ActionLink key={defensive.displayAction?.id} {...defensive.displayAction} /></>
		return <><Trans id="ast.dropped-defensives.action.header"><ActionLink key={index} {...defensive.defensive} /> as activated by {actionStatusDependency}</Trans></>
	}

	override output() {
		return <>
			<p>
				<Trans id="ast.dropped-defensives.messages.explanation">
				This section keeps track of every defensive that could have been used, but was instead overwritten or dropped to allow for more precise planning of mitigation or healing.<br />
				Note: number of total uses is not tracked here as those actions are noted in other sections. E.g. <DataLink action={'NEUTRAL_SECT'} /> is tracked under defensives and relates to <DataLink action={'SUN_SIGN'} />.<br />
				For ease of reference, the underlying action or status is noted with each action listed below.
				</Trans>
			</p>
			<Accordion
				exclusive={false}
				styled
				fluid
				panels={
					this.defensivesHistory.map((defensive, index) => {
						return {
							key: defensive.defensive.id,
							title: {
								content: this.returnHeader(defensive, index),
							},
							content: {
								content: <Table compact unstackable celled>
									<Table.Body>
										{
											defensive.history.map((entry) => {
												return this.returnRow(entry)
											})
										}
									</Table.Body>
								</Table>,
							},
						}
					})
				}
			/>
		</>
	}

}
