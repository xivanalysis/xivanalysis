import {RotationTarget} from 'components/ui/RotationTable'
import {HistoryEntry} from '../../History'
import {Suggestion} from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

export abstract class NotesEvaluator implements WindowEvaluator {

	protected abstract header : RotationTarget
	protected abstract generateNotes(window: HistoryEntry<EvaluatedAction[]>): JSX.Element

	suggest(_windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput  {
		return {
			format: 'notes',
			header: this.header,
			rows: windows.map(w => this.generateNotes(w)),
		}
	}
}
