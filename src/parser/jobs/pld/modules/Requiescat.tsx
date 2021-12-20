import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, AllowedGcdsOnlyOptions, BuffWindow, calculateExpectedGcdsForTime, EvaluatedAction, ExpectedActionsEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

const SEVERITIES = {
	MISSED_CASTS: {
		1: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	},
	MISSED_CONFITEORS: {
		1: SEVERITY.MAJOR,
	},
}
const EXPECTED_REQUIESCAT_CASTS = 5
// When calculating rushing, adjust the start of the window by 1.5 seconds to allow for using Requiescat in the first weave slot
const WINDOW_START_FORGIVENESS_FOR_RUSHING = 1500
const REQUIESCAT_DURATION = 30000

class RequiescatUsageEvaluator implements WindowEvaluator {
	// Because this class is not an Analyser, it cannot use Data directly to get the id or icon for Requiescat, so require the action object in the constructor
	private requiescatIcon: string
	private requiescatUsages: number

	constructor (requiescatUsages: number, requiescatIcon: string) {
		this.requiescatUsages = requiescatUsages
		this.requiescatIcon = requiescatIcon
	}


	//As far as I can tell, this only exists to be overridden later, so I'm not too concerned about its contents.
	suggest() {
		const missedRequiescatBuffs = this.requiescatUsages

		return new TieredSuggestion({
			icon: this.requiescatIcon,
			why: <Trans id="pld.requiescat.suggestions.nobuff.why">
				<Plural value={missedRequiescatBuffs} one="# usage" other="# usages"/> while under 80% MP.
			</Trans>,
			content: <Trans id="pld.requiescat.suggestions.nobuff.content">
				<DataLink action="REQUIESCAT"/> should only be used when over 80% MP.
				Otherwise, you will not get the <DataLink status="REQUIESCAT"/> buff,
				which provides 50% increased magic damage, instant cast times,
				and allows you to cast <DataLink action="CONFITEOR"/>.
			</Trans>,
			tiers: SEVERITIES.MISSED_BUFF_REQUIESCAT,
			value: missedRequiescatBuffs,
		})
	}

	output() {
		return undefined
	}
}

interface RequiescatGcdsOptions extends AllowedGcdsOnlyOptions {
	downtime: Downtime
}

class RequiescatGcdsEvaluator extends AllowedGcdsOnlyEvaluator {
	private downtime: Downtime

	constructor(opts: RequiescatGcdsOptions) {
		super(opts)
		this.downtime = opts.downtime
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missedCasts = windows.reduce((acc, window) => acc + this.calculateMissedGcdsForWindow(window), 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: missedCasts,
			why: <Trans id="pld.requiescat.suggestions.wrong-gcd.why">
				<Plural value={missedCasts} one="# missing cast" other="# missing casts"/> during the {this.suggestionWindowName} buff window.
			</Trans>,
		})
	}

	private calculateMissedGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const expectedGCDs = this.calculateExpectedGcdsForWindow(window)
		const usedRequiescatGCDs = window.data.filter(cast => cast.action.onGcd && this.allowedGcds.includes(cast.action.id)).length
		return Math.max(0, expectedGCDs - usedRequiescatGCDs)
	}

	override calculateExpectedGcdsForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const originalWindowEnd = window.start + REQUIESCAT_DURATION
		const downtimeInWindow = this.downtime.getDowntime(window.start, originalWindowEnd)
		const adjustedWindowEnd = originalWindowEnd - downtimeInWindow
		const adjustedWindowStart = window.start + WINDOW_START_FORGIVENESS_FOR_RUSHING

		// Reduce calculated amount by 1 to not report the Confietor cast as an expected Holy Spirit/Circle cast
		return calculateExpectedGcdsForTime(EXPECTED_REQUIESCAT_CASTS, this.globalCooldown.getEstimate(), adjustedWindowStart, adjustedWindowEnd) - 1
	}
}
export class Requiescat extends BuffWindow {
	static override handle = 'requiescat'
	static override title = t('pld.requiescat.title')`Requiescat Usage`

	@dependency downtime!: Downtime
	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.REQUIESCAT

	private requiescatUsages: 0

	override initialise() {
		super.initialise()
		this.addEvaluator(new RequiescatGcdsEvaluator({
			expectedGcdCount: 4,
			allowedGcds: [
				this.data.actions.HOLY_SPIRIT.id,
				this.data.actions.HOLY_CIRCLE.id,
			],
			downtime: this.downtime,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.HOLY_SPIRIT.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.wrong-gcd.content">
				GCDs used during <DataLink action="REQUIESCAT" /> should consist of 4 uses of <DataLink action="HOLY_SPIRIT" /> (or
				multi-hit <DataLink action="HOLY_CIRCLE" />) and 1 use of <DataLink action="CONFITEOR" /> for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: SEVERITIES.MISSED_CASTS,
		}))
		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.CONFITEOR.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.missed-confiteor.content">
				Be sure to end each <DataLink status="REQUIESCAT" /> window with <DataLink action="CONFITEOR" /> for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: SEVERITIES.MISSED_CONFITEORS,
			adjustCount: this.adjustExpectedConfiteorCount.bind(this),
		}))

		this.addEventHook({type: 'action', source: this.parser.actor.id, action: this.data.actions.REQUIESCAT.id}, () => this.requiescatUsages++)

		this.addEvaluator(new RequiescatUsageEvaluator(this.requiescatUsages, this.data.actions.REQUIESCAT.icon))
	}

	private adjustExpectedConfiteorCount(window: HistoryEntry<EvaluatedAction[]>) {
		if (window.end == null) {
			return 0
		}

		const originalWindowEnd = window.start + REQUIESCAT_DURATION
		const downtimeInWindow = this.downtime.getDowntime(window.start, originalWindowEnd)
		const adjustedWindowEnd = originalWindowEnd - downtimeInWindow
		const adjustedWindowDuration = adjustedWindowEnd - window.start
		if (adjustedWindowDuration < this.globalCooldown.getEstimate()) {
			return -1
		}

		return 0
	}

	override output() {
		return <Fragment>
			<Message>
				<Trans id="pld.requiescat.table.note">Each of your <DataLink status="REQUIESCAT" /> windows should contain 5 spells, consisting of 4 casts of <DataLink action="HOLY_SPIRIT" /> or <DataLink action="HOLY_CIRCLE" /> and endING with a cast of <DataLink action="CONFITEOR" />.</Trans>
			</Message>
			<>{super.output()}</>
		</Fragment>
	}
}
