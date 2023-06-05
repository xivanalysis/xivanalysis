import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs} from 'parser/core/modules/Procs'
import React, {Fragment} from 'react'
import {Table, Button} from 'semantic-ui-react'

export class RefulgentProcs extends Procs {
	static override title = t('brd.procs.title')`Straight Shot Ready Overwrites`
	override trackedProcs = [
		{
			procStatus: this.data.statuses.STRAIGHT_SHOT_READY,
			consumeActions: [this.data.actions.REFULGENT_ARROW],
		},
	]

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.REFULGENT_ARROW.icon
	override droppedProcContent = <Trans id="brd.procs.suggestions.missed.content">
		Try to use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> whenever you have <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} />.
	</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.REFULGENT_ARROW.icon
	override overwroteProcContent = <Trans id="brd.procs.suggestions.overwritten.content">
		Avoid using actions that grant <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> when you
		could use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> instead.
	</Trans>

	override output() {
		const allOverwrites = this.getOverwritesForStatus(this.data.statuses.STRAIGHT_SHOT_READY.id).sort((a, b) => a.timestamp - b.timestamp)
		if (allOverwrites.length === 0) { return }

		return <Fragment>
			<Trans id="brd.procs.refulgentproc.content">
				<StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> is always generated by <ActionLink {...this.data.actions.BARRAGE} />&nbsp;
				and may be generated by <ActionLink {...this.data.actions.IRON_JAWS} />, <ActionLink {...this.data.actions.CAUSTIC_BITE} />, and <ActionLink {...this.data.actions.STORMBITE} />.
			</Trans>
			<Table collapsing unstackable compact="very">
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="brd.procs.refulgentproc.timestamp-header">Timestamp</Trans></Table.HeaderCell>
						<Table.HeaderCell></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{allOverwrites.map(item => {
						return <Table.Row key={item.timestamp}>
							<Table.Cell>{this.parser.formatEpochTimestamp(item.timestamp)}</Table.Cell>
							<Table.Cell>
								<Button onClick={() =>
									this.timeline.show(item.timestamp - this.parser.pull.timestamp, item.timestamp - this.parser.pull.timestamp)}>
									<Trans id="brd.procs.refulgentproc.timelinelink-button">Jump to Timeline</Trans>
								</Button>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</Fragment>
	}
}
