import {Trans} from '@lingui/react'
import Rotation from 'components/ui/Rotation'
import {CastEvent} from 'fflogs'
import {Duration} from 'luxon'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'

export interface RotationTarget {
	header: React.ReactNode
	accessor: string | ((entry: RotationTableEntry) => RotationTargetData)
}

export interface RotationTargetData {
	expected: number
	actual: number
}

export interface RotationTableEntry {
	start: number
	end: number
	targetsData?: {
		[id: string]: RotationTargetData,
	}
	rotation: CastEvent[]
}

interface RotationTableProps {
	targets: RotationTarget[]
	data: RotationTableEntry[]
	onGoto: (start: number, end: number) => void
}

interface RotationTableRowProps {
	targets: RotationTarget[]
	onGoto: (start: number, end: number) => void
}

export class RotationTable extends React.Component<RotationTableProps> {
	static Row = ({onGoto, targets, start, end, targetsData, rotation}: RotationTableRowProps & RotationTableEntry) => {
		return <Table.Row>
			<Table.Cell textAlign="center">
				<span style={{marginRight: 5}}>{Duration.fromMillis(start).toFormat('mm:ss')}</span>
				<Button
					circular
					compact
					size="mini"
					icon="time"
					onClick={() => {
						return onGoto(start, end)
					}}
				/>
			</Table.Cell>
			{
				targets
					.map(target => {
						if (typeof target.accessor === 'string' && targetsData != null) {
							return targetsData[target.accessor]
						} else if (typeof target.accessor === 'function') {
							return target.accessor({start, end, targetsData, rotation})
						} else {
							return {
								actual: 0,
								expected: 0,
							}
						}
					})
					.map((targetEntry, i) =>
						<Table.Cell
							key={`target_${i}`}
							textAlign="center"
							positive={targetEntry.actual >= targetEntry.expected}
							negative={targetEntry.actual < targetEntry.expected}
						>
							{targetEntry.actual}/{targetEntry.expected}
						</Table.Cell>,
					)
			}
			<Table.Cell>
				<Rotation events={rotation}/>
			</Table.Cell>
		</Table.Row>
	}

	render(): React.ReactNode {
		const {
			targets,
			data,
			onGoto,
		} = this.props

		return <Table compact unstackable celled>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.rotation-table.header.time">Time</Trans></strong>
					</Table.HeaderCell>
					{
						targets.map((target, i) =>
							<Table.HeaderCell key={`target_header_${i}`} textAlign="center" collapsing>
								<strong>{target.header}</strong>
							</Table.HeaderCell>,
						)
					}
					<Table.HeaderCell>
						<strong><Trans id="core.ui.rotation-table.header.rotation">Rotation</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					data.map((entry) =>
						<RotationTable.Row key={entry.start} onGoto={onGoto} targets={targets} {...entry}/>,
					)
				}
			</Table.Body>
		</Table>
	}
}
