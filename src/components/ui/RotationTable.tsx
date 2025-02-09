import {Trans} from '@lingui/react'
import {Rotation, RotationEvent} from 'components/ui/Rotation'
import {Component, ReactNode} from 'react'
import {Button, Table} from 'semantic-ui-react'
import {isDefined, formatDuration} from 'utilities'

export interface RotationTarget {
	/**
	 * Displayed header
	 */
	header: ReactNode
	/**
	 * Accessor can either be a string, in which case this will resolve to the value assigned to the same key in the `targetsData` field in each entry,
	 * or a function resolving the entry to the `RotationTargetData`.
	 */
	accessor: string | ((entry: RotationTableEntry) => RotationTargetData)
}

export interface RotationNotes {
	/**
	 * Displayed header
	 */
	header: ReactNode
	/**
	 * Accessor can either be a string, in which case this will resolve to the value assigned to the same key in the `targetsData` field in each entry,
	 * or a function resolving the entry to the `RotationTargetData`.
	 */
	accessor: string | ((entry: RotationTableEntry) => ReactNode)
}

/**
 * Determines how a rotation target gets highlighted (negative = red, positive = green)
 */
export enum RotationTargetOutcome { NEGATIVE, NEUTRAL, POSITIVE }

export interface RotationTargetData {
	/**
	 * Expected target number
	 */
	expected?: number
	/**
	 * Recorded number
	 */
	actual: number
	/**
	 * Optional function to override the default positive/negative highlighting
	 */
	targetComparator?: (actual: number, expected?: number) => RotationTargetOutcome
}

export interface RotationTableTargetData {
	/**
	 * Identifier to Target Data mapping
	 */
	[id: string]: RotationTargetData
}

export interface RotationTableNotesMap {
	/**
	 * Identifier to Notes mapping
	 */
	[id: string]: ReactNode
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
	 * Map of pre calculated target data
	 */
	notesMap?: RotationTableNotesMap
	/**
	 * Rotation to display that occurs during this entry
	 */
	rotation: RotationEvent[]
}

interface RotationTableProps {
	/**
	 * List of Targets to display, consisting of the displayed header and the accessor to resolve the actual and expected values
	 */
	targets?: RotationTarget[]
	/**
	 * List of Notes to display, consisting of the displayed header and the accessor to resolve the value
	 */
	notes?: RotationNotes[]
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
	/**
	 * Optional property to provide a JSX.Element (translation tag) for the header value.
	 * Defaults to "Rotation"
	 */
	headerTitle?: JSX.Element
}

interface RotationTableRowProps {
	/**
	 * List of Targets to display, consisting of the displayed header and the accessor to resolve the actual and expected values
	 */
	targets: RotationTarget[]
	/**
	 * List of Notes to display, consisting of the displayed header and the accessor to resolve the value
	 */
	notes: RotationNotes[]
	/**
	 * Optional Callback to display the jump to time button.
	 * Usually this should be a pass through of the `Timeline.show` function.
	 * @param start
	 * @param end
	 * @param scrollTo
	 */
	onGoto?: (start: number, end: number, scrollTo?: boolean) => void
}

export class RotationTable extends Component<RotationTableProps> {
	static defaultTargetComparator(actual: number, expected?: number): RotationTargetOutcome {
		if (!isDefined(expected)) {
			return RotationTargetOutcome.NEUTRAL
		}

		if (actual >= expected) {
			return RotationTargetOutcome.POSITIVE
		}

		return RotationTargetOutcome.NEGATIVE
	}

	static targetAccessorResolver = (entry: RotationTableEntry, target: RotationTarget): RotationTargetData => {
		if (typeof target.accessor === 'string' && entry.targetsData != null) {
			return entry.targetsData[target.accessor]
		}

		if (typeof target.accessor === 'function') {
			return target.accessor(entry)
		}

		return {
			actual: 0,
			expected: 0,
		}
	}

	static notesAccessorResolver = (entry: RotationTableEntry, note: RotationNotes): ReactNode => {
		if (typeof note.accessor === 'string' && entry.notesMap != null) {
			return entry.notesMap[note.accessor]
		}

		if (typeof note.accessor === 'function') {
			return note.accessor(entry)
		}

		return null
	}

	static TargetCell = ({actual, expected, targetComparator}: RotationTargetData) => {
		if (targetComparator === undefined) {
			targetComparator = RotationTable.defaultTargetComparator
		}
		const targetOutcome = targetComparator(actual, expected)

		return <Table.Cell
			textAlign="center"
			positive={targetOutcome === RotationTargetOutcome.POSITIVE}
			negative={targetOutcome === RotationTargetOutcome.NEGATIVE}
		>
			{actual}/{expected === undefined ? '-' : expected}
		</Table.Cell>
	}

	static Row = ({onGoto, targets, notes, notesMap, start, end, targetsData, rotation}: RotationTableRowProps & RotationTableEntry) =>
		<Table.Row>
			<Table.Cell textAlign="center">
				<span style={{marginRight: 5}}>{formatDuration(start, {secondPrecision: 0})}</span>
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
					.map(target => RotationTable.targetAccessorResolver({start, end, targetsData, rotation}, target))
					.map((targetEntry, i) => <RotationTable.TargetCell key={`target_${i}`} {...targetEntry}/>)
			}
			<Table.Cell>
				<Rotation events={rotation}/>
			</Table.Cell>
			{
				notes
					.map(note => RotationTable.notesAccessorResolver({start, end, targetsData, notesMap, rotation}, note))
					.map((noteEntry, i) =>
						<Table.Cell
							key={`notes_${i}`}
							textAlign="center"
						>
							{noteEntry}
						</Table.Cell>,
					)
			}
		</Table.Row>

	override render(): ReactNode {
		const {
			targets,
			notes,
			data,
			onGoto,
			headerTitle,
		} = this.props

		return <Table compact unstackable celled>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.rotation-table.header.time">Time</Trans></strong>
					</Table.HeaderCell>
					{
						(targets || []).map((target, i) =>
							<Table.HeaderCell key={`target_header_${i}`} textAlign="center" collapsing>
								<strong>{target.header}</strong>
							</Table.HeaderCell>,
						)
					}
					<Table.HeaderCell>
						<strong>{(headerTitle)? headerTitle : <Trans id="core.ui.rotation-table.header.rotation">Rotation</Trans>}</strong>
					</Table.HeaderCell>
					{
						(notes || []).map((note, i) =>
							<Table.HeaderCell key={`note_header_${i}`} textAlign="center" collapsing>
								<strong>{note.header}</strong>
							</Table.HeaderCell>,
						)
					}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					data.map((entry) =>
						<RotationTable.Row key={entry.start} onGoto={onGoto} targets={targets || []} notes={notes || []} {...entry}/>,
					)
				}
			</Table.Body>
		</Table>
	}
}
