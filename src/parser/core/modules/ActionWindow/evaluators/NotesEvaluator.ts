import {RotationTarget} from 'components/ui/RotationTable'
import {Suggestion} from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

export abstract class NotesEvaluator implements WindowEvaluator {

	protected abstract header : RotationTarget | undefined
	protected abstract generateNotes(window: HistoryEntry<EvaluatedAction[]>): JSX.Element

	suggest(_windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		if (this.header == null) { return }
		return {
			format: 'notes',
			header: this.header,
			rows: windows.map(window => this.generateNotes(window)),
		}
	}
}
