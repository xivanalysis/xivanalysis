import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import React from 'react'
import {Grid, Table} from 'semantic-ui-react'

export class Aetherflow extends Analyser {
	static override handle = 'aetherflow'
	static override title = t('sch.aetherflow.title')`Aetherflow`

	private recticationActive: boolean = false;
	private aetherflowWindows: AetherflowWindow[] = [];
	private totalAetherflowConsumeActions: number = 0;
	private prevAetherflowWindow?: AetherflowWindow;
	private prevDissipationWindow?: AetherflowWindow;

	@dependency private data!: Data

	private readonly AETHERFLOW_GENERATE_ACTIONS: number[] = [
		this.data.actions.AETHERFLOW.id,
		this.data.actions.DISSIPATION.id,
	]

	private readonly AETHERFLOW_CONSUME_ACTIONS: number[] = [
		this.data.actions.LUSTRATE.id,
		this.data.actions.EXCOGITATION.id,
		this.data.actions.INDOMITABILITY.id,
		this.data.actions.SACRED_SOIL.id,
		this.data.actions.SCH_ENERGY_DRAIN.id,
	];

	private readonly RECITATION_ACTIONS: number[] = [
		this.data.actions.EXCOGITATION.id,
		this.data.actions.INDOMITABILITY.id,
		this.data.actions.ADLOQUIUM.id,
		this.data.actions.SUCCOR.id,
	];

	private readonly AETHERFLOW_CHARGES_PER_CAST = 3;
	private readonly FIRST_AETHERFLOW_CAST_TIME = 7500;

	override initialise() {
		const generateAetherflowFilter = filter<Event>()
			.type('action')
			.source(this.parser.actor.id)
			.action(oneOf(this.AETHERFLOW_GENERATE_ACTIONS))
		const consumeAetherflowFilter = filter<Event>()
			.type('action')
			.source(this.parser.actor.id)
			.action(oneOf(this.AETHERFLOW_CONSUME_ACTIONS))
		const recitationFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.RECITATION.id)

		this.addEventHook(generateAetherflowFilter, this.onGenerateAetherflow)
		this.addEventHook(consumeAetherflowFilter, this.onConsumeAetherflow)
		this.addEventHook(
			recitationFilter.type('statusApply'),
			this.recitationApplied)
		this.addEventHook(
			recitationFilter.type('statusRemove'),
			this.recitationRemoved)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.recitationRemoved)
	}

	override output() {
		return <Table>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.cast-time">Cast Times</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.cooldown">CD</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.drift">Drift</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.abilities-used">Abilities Used</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="sch.aetherflow.stacks-wasted">Stacks Wasted</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.aetherflowWindows.map(aetherflowWindow => {
					return <Table.Row key={aetherflowWindow.timestamp}>
						<Table.Cell><ActionLink {...this.data.getAction(aetherflowWindow.aetherflowGenerateActionId)}/></Table.Cell>
						<Table.Cell>{this.parser.formatEpochTimestamp(aetherflowWindow.timestamp)}</Table.Cell>
						<Table.Cell>{aetherflowWindow.downtime > 0 && this.parser.formatDuration(aetherflowWindow.downtime)}</Table.Cell>
						<Table.Cell>{aetherflowWindow.drift > 0 && this.parser.formatDuration(aetherflowWindow.drift)}</Table.Cell>
						<Table.Cell>
							<Grid>
								{aetherflowWindow.aetherflowConsumeActions.map((actionId, index) => <Grid.Column key={index} width={5}>
									<ActionLink {...this.data.getAction(actionId)}/>
								</Grid.Column>)}
							</Grid>
						</Table.Cell>
						<Table.Cell>{this.AETHERFLOW_CHARGES_PER_CAST - aetherflowWindow.aetherflowConsumeActions.length || '-'}</Table.Cell>
					</Table.Row>
				})}
				<Table.Row>
					<Table.Cell colSpan="5" textAlign="right"><Trans id="sch.aetherflow.total-stacks-wasted">Total Stacks Wasted</Trans></Table.Cell>
					<Table.Cell>{this.aetherflowWindows.length * this.AETHERFLOW_CHARGES_PER_CAST - this.totalAetherflowConsumeActions}</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table>
	}

	private onGenerateAetherflow(event: Events['action']) {
		// Calculate any values that depend on the previous aetherflow window
		const prevWindow = event.action === this.data.actions.AETHERFLOW.id ? this.prevAetherflowWindow : this.prevDissipationWindow
		const cooldown = this.data.getAction(event.action)?.cooldown ?? this.data.actions.AETHERFLOW.cooldown
		let downtime = 0
		let drift = 0
		if (this.aetherflowWindows.length > 1 && prevWindow) {
			downtime = event.timestamp - prevWindow.timestamp - cooldown
			drift = prevWindow.drift + downtime
		}

		const newAetherflowWindow = {
			aetherflowGenerateActionId: event.action,
			timestamp: event.timestamp,
			downtime: downtime,
			drift: drift,
			aetherflowConsumeActions: [],
		}

		// Overwrite appropriate previous window with the new window
		if (event.action === this.data.actions.AETHERFLOW.id) {
			this.prevAetherflowWindow = newAetherflowWindow
		} else {
			this.prevDissipationWindow = newAetherflowWindow
		}

		this.aetherflowWindows.push(newAetherflowWindow)
	}

	private onConsumeAetherflow(event: Events['action']) {
		// If recitation is inactive, or if the aetherflow action is not a recitation action add the action to the aetherflow window
		if (!this.recticationActive || !this.RECITATION_ACTIONS.some(recitationActionId => recitationActionId === event.action)) {
			this.aetherflowWindows[this.aetherflowWindows.length - 1].aetherflowConsumeActions.push(event.action)
			this.totalAetherflowConsumeActions++
		}
	}

	private recitationApplied() {
		this.recticationActive = true
	}

	private recitationRemoved() {
		this.recticationActive = false
	}
}

interface AetherflowWindow {
	aetherflowGenerateActionId: number
	timestamp: number
	downtime: number
	drift: number
	aetherflowConsumeActions: number[]
}
