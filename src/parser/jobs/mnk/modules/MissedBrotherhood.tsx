import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {EvaluatedAction, RaidBuffWindow, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {HistoryEntryPredicate} from 'parser/core/modules/ActionWindow/windows/ActionWindow'
import {SEVERITY, SeverityTiers, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {Brotherhood} from './Brotherhood'
import {RiddleOfFire} from './RiddleOfFire'

const MISSED_BROTHERHOOD_TIERS: SeverityTiers = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

class MissedBrotherhoodEvaluator implements WindowEvaluator {
	private icon: string
	constructor(icon: string) {
		this.icon = icon
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined {
		if (windows.length === 0) {
			return undefined
		}

		return new TieredSuggestion({
			icon: this.icon,
			content: <Trans id="mnk.brotherhood.missed-window.content">
				Try and make sure your <DataLink action="BROTHERHOOD"/> casts line up with your <DataLink action="RIDDLE_OF_FIRE"/> windows to maximize buff stacking.
			</Trans>,
			tiers: MISSED_BROTHERHOOD_TIERS,
			value: windows.length,
			why: <Trans id="mnk.brotherhood.missed-window.why">
				<Plural value={windows.length} one="# cast" other="# casts"/> of <DataLink action="BROTHERHOOD"/> did not occur during a <DataLink status="RIDDLE_OF_FIRE"/> window.
			</Trans>,
		})
	}
	public output() { return undefined }
}

export class MissedBrotherhood extends RaidBuffWindow {
	static override handle = 'missedBrotherhood'
	static override title = t('mnk.missedbrotherhood.title')`Brotherhood`

	override buffStatus = this.data.statuses.BROTHERHOOD

	private missedBrotherhoodFilter: HistoryEntryPredicate = (e: HistoryEntry<EvaluatedAction[]>) => {
		return this.brotherhood.unmatchedWindows.map(window => window.start).includes(e.start)
	}

	@dependency brotherhood!: Brotherhood

	/**
	 * Despite not consuming any data directly from RoF, we include it here to ensure
	 * that it has run prior to performing this analysis
	 */
	@dependency riddleOfFire!: RiddleOfFire

	override initialise() {
		super.initialise()

		this.setHistoryFilter(this.missedBrotherhoodFilter)
		this.addEvaluator(new MissedBrotherhoodEvaluator(this.data.actions.BROTHERHOOD.icon))
	}

	override output() {
		const content = super.output()
		if (content == null) {
			return undefined
		}

		return <>
			<Message>
				<Trans id="mnk.missedbrotherhood.disclaimer">Ideally, Brotherhood should always be used within a Riddle of Fire window,
				however, in cases where this does not happen and its usage drifts, this module will show you relevant buff information
				for said usage.</Trans>
			</Message>
			{content}
		</>
	}
}
