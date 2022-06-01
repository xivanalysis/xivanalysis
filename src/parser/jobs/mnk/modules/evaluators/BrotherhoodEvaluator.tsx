import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, EvaluationOutput, NotesEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Brotherhood, OverlapStatus} from '../Brotherhood'

export class BrotherhoodDriftEvaluator extends NotesEvaluator {
	private brotherhood!: Brotherhood
	private suggestionIcon: string

	constructor(brotherhood: Brotherhood, suggestionIcon: string) {
		super()
		this.brotherhood = brotherhood
		this.suggestionIcon = suggestionIcon
	}

	header = {
		header: <DataLink showName={false} action="BROTHERHOOD"/>,
		accessor: 'brotherhoodstatus',
	}

	// For any given RoF window, a brotherhood window can
	// * Start before and end during (Used early)
	// * Start during and end during (Correct)
	// * Start during and end after (Used late)
	// * Be completely unrelated
	override generateNotes(window: HistoryEntry<EvaluatedAction[]>) {
		const matchedWindow = this.brotherhood.findMatchingWindow(window)
		if (matchedWindow == null) {
			return <Trans id="mnk.rof.chart.notes.none">None</Trans>
		}

		switch (matchedWindow.status) {
		case OverlapStatus.USED_EARLY:
			return <Trans id="mnk.rof.chart.notes.late">Used Early</Trans>
		case OverlapStatus.USED_LATE:
			return <Trans id="mnk.rof.chart.notes.early">Used Late</Trans>
		case OverlapStatus.IN_WINDOW:
			return <Trans id="mnk.rof.chart.notes.inwindow">In Window</Trans>
		default:
			// Invalid, but returning None makes more sense here than failing to
			// render the entire page
			return <Trans id="mnk.rof.chart.notes.none">None</Trans>
		}
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined {
		const matchedWindows = windows.map(this.brotherhood.findMatchingWindow, this.brotherhood)
		const driftedWindows = matchedWindows.filter(w => w != null && w.status !== OverlapStatus.IN_WINDOW)
		if (driftedWindows.length === 0) {
			return undefined
		}

		return new Suggestion({
			icon: this.suggestionIcon,
			content: <Trans id="mnk.brotherhood.drifted-window.content.">
				Try and make sure your <DataLink action="BROTHERHOOD"/> casts are fully included within a <DataLink action="RIDDLE_OF_FIRE"/> window.
			</Trans>,
			severity: SEVERITY.MINOR,
			why: <Trans id="mnk.brotherhood.drifted-window.why">
				<Plural value={driftedWindows.length} one= "# cast" other="% casts"/> of <DataLink action="BROTHERHOOD"/> was either early or late for a <DataLink action="RIDDLE_OF_FIRE"/> window.
			</Trans>,
		})
	}
}

export class BrotherhoodRaidBuffEvaluator implements WindowEvaluator {
	private brotherhood: Brotherhood
	constructor(brotherhood: Brotherhood) {
		this.brotherhood = brotherhood
	}
	public suggest() { return undefined }
	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		const matchedWindows = windows.map(this.brotherhood.findMatchingWindow, this.brotherhood)

		return {
			format: 'table',
			header: {
				header: <DataLink showName={false} status="BROTHERHOOD"/>,
				accessor: 'buffed',
			},
			rows: matchedWindows.map(w => {
				if (w == null) {
					return {
						actual: 0,
					}
				}

				return {
					actual: w.targetsHit,
					expected: this.brotherhood.expectedTargetCount,
				}
			}),
		}
	}
}
