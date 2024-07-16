import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import iconF3p from '../f3p.png'

export interface ExtraF1EvaluatorOpts {
	manafontId: number
	paradoxId: number
	fire3Id: number
}

export class FirestarterUsageEvaluator extends RulePassedEvaluator {
	private manafontId: number
	private paradoxId: number
	private fire3Id: number

	override header = undefined

	constructor(opts: ExtraF1EvaluatorOpts) {
		super()

		this.manafontId = opts.manafontId
		this.paradoxId = opts.paradoxId
		this.fire3Id = opts.fire3Id
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		// If the window ended in manafont, we won't worry about whether or not an F3P was used, because we'll get another one from the Manafont Paradox
		if (window.data[window.data.length - 1].action.id === this.manafontId) { return }

		const paradoxIndex = window.data.findIndex(event => event.action.id === this.paradoxId)

		// If the window didn't generate a Firestarter, no need to evaluate whether it was properly used
		if (paradoxIndex === -1) { return }

		// Find out if the window contained an F3 after Paradox was used, it could've been saved to gain AF3 on a subsequent window
		const containsAF3F3P = window.data.slice(paradoxIndex).some(event => event.action.id === this.fire3Id)

		// Not assigning an error code since the DPS differential is small and there are alignment reasons for using Firestarter to extend a window
		return !containsAF3F3P
	}

	// Suggestion for unneccessary F1s
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const extendedF3Ps = this.failedRuleCount(windows)

		if (extendedF3Ps <= 0) { return undefined }

		return new Suggestion({
			icon: iconF3p,
			content: <Trans id="blm.rotation-watchdog.suggestions.firestarter-usage.content">
				Saving <DataLink status="FIRESTARTER" /> to gain Astral Fire III after using <DataLink action="TRANSPOSE" /> to exit your Umbral Ice phase is a minor DPS increase over using it to extend the Astral Fire phase it was generated in,
				unless you use <DataLink action="MANAFONT" /> to generate another from the extra <DataLink action="PARADOX" />. Try to save the proc, unless you absolutely need to for movement or cooldown alignment reasons.
			</Trans>,
			severity: SEVERITY.MINOR,
			why: <Trans id="blm.rotation-watchdog.suggestions.firestarter-usage.why">
				<DataLink showIcon={false} status="FIRESTARTER" /> was used to extend Astral Fire <Plural value={extendedF3Ps} one="# time" other="# times" />.
			</Trans>,
		})
	}
}
