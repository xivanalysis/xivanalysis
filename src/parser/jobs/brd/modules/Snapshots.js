/**
 * @author Ririan
 */
import React from 'react'
import {Trans} from '@lingui/react'
import {t} from '@lingui/macro'
import {Table} from 'semantic-ui-react'
import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'

export default class Snapshots extends Module {
	static handle = 'snapshots'
	static title = t('brd.snapshots.title')`Snapshots`
	static dependencies = [
		//AdditionalStats module is needed because it handles adding snapshots to events.
		'additionalStats', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'util',
	]

	_snapshotEvents = []

	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: [ACTIONS.CAUSTIC_BITE.id, ACTIONS.STORMBITE.id, ACTIONS.IRON_JAWS.id],
		}, event => this._snapshotEvents.push(event))

	}

	output() {
		const snapshotEvents = this._snapshotEvents

		if (snapshotEvents.length === 0) {
			return
		}

		// Builds a row for each snapshot event
		const rows = snapshotEvents.map(snapshotEvent => {
			let snapshot = snapshotEvent.snapshot
			if (!snapshot) {
				// I currently have no idea how this happens, this means that AdditonalStats didn't recieve a cast event for it, but it got added in after or something
				// So we can show they did cast it, I'm going to generate an empty snapshot
				snapshot = {statuses: []}
			}
			const snapshotCell = <Table.Cell>
				{
					Object.keys(snapshot.statuses).map(id => {
						//To avoid showing statuses we do not currently know of, as that will cause an infinite loading circle
						if (snapshot.statuses[id].isActive && getDataBy(STATUSES, 'id', Number(id))) {
							//35px is a purely arbitrary value that I think looks nice.  The default icon size for statuses are too small.
							return <StatusLink  key={id} showName={false} iconSize="35px" {...getDataBy(STATUSES, 'id', Number(id))}/>
						}
					})
				}
			</Table.Cell>

			return <Table.Row key={snapshotEvent.timestamp}>
				<Table.Cell>
					{this.util.createTimelineButton(snapshotEvent.timestamp)}
				</Table.Cell>
				<Table.Cell>
					<ActionLink {...getDataBy(ACTIONS, 'id', snapshotEvent.ability.guid)}/>
				</Table.Cell>
				{snapshotCell}
			</Table.Row>
		})

		// Output is a Table, where every row after the header contains individual snapshots
		return <Table>
			<Table.Header>
				<Table.Row key="header">
					<Table.HeaderCell><Trans id="brd.snapshots.time">Time</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.snapshots.snapshotter">Snapshotter</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.snapshots.statuses">Statuses</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{rows}
			</Table.Body>
		</Table>
	}
}
