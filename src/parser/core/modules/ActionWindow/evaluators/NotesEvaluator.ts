import {RotationTarget} from 'components/ui/RotationTable'
import {HistoryEntry} from '../../History'
import {Suggestion} from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

export abstract class NotesEvaluator implements WindowEvaluator {

	protected abstract header : RotationTarget
	protected abstract generateNotes(window: HistoryEntry<EvaluatedAction[]>): JSX.Element

	// Derived classes may decide to suggest, in which case they need the windows.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput  {
		return {
			format: 'notes',
			header: this.header,
			rows: windows.map(w => this.generateNotes(w)),
		}
	}
}
