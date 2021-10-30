import {RotationTarget, RotationTargetData} from 'components/ui/RotationTable'
import {HistoryEntry} from '../../History'
import {Suggestion} from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'

interface TableOutput  {
	format: 'table'
	header: RotationTarget
	rows: RotationTargetData[]
}
interface NotesOutput {
	format: 'notes'
	// To be most accurate, this type should be RotationNotes.  However, both types have the
	// same properties and the consumer works with this type.  Making this be RotationNotes
	// requires extra discrimnate function calls in the consumer for table format data.
	header: RotationTarget
	rows: JSX.Element[]
}
export type EvaluationOutput = TableOutput | NotesOutput

/**
 * Base interface for classes that evaluate a window and
 * generate suggestions and/or output.
 * @see ActionWindow
 */
export interface WindowEvaluator {
	/**
	 * Generates suggestions based on the entire history.
	 * If this evaluator does not create suggestions, it should return undefined.
	 */
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined
	/**
	 * Generates output for the windows.
	 * If this evaluator does not create output, it should return undefined.
	 */
	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | EvaluationOutput[] | undefined
}
