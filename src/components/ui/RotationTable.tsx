import {Trans} from '@lingui/react'
import Rotation from 'components/ui/Rotation'
import {CastEvent} from 'fflogs'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {formatDuration} from 'utilities'

export interface RotationTarget {
	/**
	 * Displayed header
	 */
	header: React.ReactNode
	/**
	 * Accessor can either be a string, in which case this will resolve to the value assigned to the same key in the `targetsData` field in each entry,
	 * or a function resolving the entry to the `RotationTargetData`.
	 */
	accessor: string | ((entry: RotationTableEntry) => RotationTargetData)
}

export interface RotationTargetData {
	/**
	 * Expected target number
	 */
	expected: number
	/**
	 * Recorded number
	 */
	actual: number
}

export interface RotationTableTargetData {
	/**
	 * Identifier to Target Data mapping
	 */
	[id: string]: RotationTargetData
}

export interface RotationTableEntry {
	/**
	 * Start point relative to fight start
	 */
	start: number
	/**
	 * End point relative to fight start
	 */
	end: number
	/**
	 * Map of pre calculated target data
	 */
	targetsData?: RotationTableTargetData
	/**
	 * Rotation to display that occurs during this entry
	 */
	rotation: CastEvent[]
}

interface RotationTableProps {
	/**
	 * List of Targets to display, consisting of the displayed header and the accessor to resolve the actual and expected values
	 */
	targets: RotationTarget[]
	/**
	 * List of table entries, consisting of a time frame and the rotation, with optionally a pre calculated target data
	 */
	data: RotationTableEntry[]
	/**
	 * Optional Callback to display the jump to time button.
	 * Usually this should be a pass through of the `Timeline.show` function.
	 * @param start
	 * @param end
	 * @param scrollTo
	 */
	onGoto?: (start: number, end: number, scrollTo?: boolean) => void
}

interface RotationTableRowProps {
	/**
	 * List of Targets to display, consisting of the displayed header and the accessor to resolve the actual and expected values
	 */
	targets: RotationTarget[]
	/**
	 * Optional Callback to display the jump to time button.
	 * Usually this should be a pass through of the `Timeline.show` function.
	 * @param start
	 * @param end
	 * @param scrollTo
	 */
	onGoto?: (start: number, end: number, scrollTo?: boolean) => void
}

export class RotationTable extends React.Component<RotationTableProps> {
	static accessorResolver = (entry: RotationTableEntry, target: RotationTarget): RotationTargetData => {
		if (typeof target.accessor === 'string' && entry.targetsData != null) {
			return entry.targetsData[target.accessor]
		} else if (typeof target.accessor === 'function') {
			return target.accessor(entry)
		} else {
			return {
				actual: 0,
				expected: 0,
			}
		}
	}

	static TargetCell = ({actual, expected}: RotationTargetData) =>
		<Table.Cell
			textAlign="center"
			positive={actual >= expected}
			negative={actual < expected}
		>
			{actual}/{expected}
		</Table.Cell>

	static Row = ({onGoto, targets, start, end, targetsData, rotation}: RotationTableRowProps & RotationTableEntry) =>
		<Table.Row>
			<Table.Cell textAlign="center">
				<span style={{marginRight: 5}}>{formatDuration(start / 1000)}</span>
				{typeof onGoto === 'function' && <Button
					circular
					compact
					size="mini"
					icon="time"
					onClick={() => onGoto(start, end)}
				/>}
			</Table.Cell>
			{
				targets
					.map(target => RotationTable.accessorResolver({start, end, targetsData, rotation}, target))
					.map((targetEntry, i) => <RotationTable.TargetCell key={`target_${i}`} {...targetEntry}/>)
			}
			<Table.Cell>
				<Rotation events={rotation}/>
			</Table.Cell>
		</Table.Row>

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
