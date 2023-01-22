import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {AllowedGcdsOnlyEvaluator, AllowedGcdsOnlyOptions, BuffWindow, calculateExpectedGcdsForTime, EvaluatedAction, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

const SEVERITIES = {
	MISSED_CASTS: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	MISSED_CONFITEOR_GCDS: {
		1: SEVERITY.MAJOR,
	},
}
const EXPECTED_REQUIESCAT_CASTS = 4
// When calculating rushing, adjust the start of the window by 1.5 seconds to allow for using Requiescat in the first weave slot
const WINDOW_START_FORGIVENESS_FOR_RUSHING = 1500
const REQUIESCAT_DURATION = 30000

const REQUIESCAT_ACTIONS: ActionKey[] = [
	'HOLY_SPIRIT',
	'HOLY_CIRCLE',
	'CONFITEOR',
	'BLADE_OF_FAITH',
	'BLADE_OF_TRUTH',
	'BLADE_OF_VALOR',
]

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

		return calculateExpectedGcdsForTime(EXPECTED_REQUIESCAT_CASTS, this.globalCooldown.getDuration(), adjustedWindowStart, adjustedWindowEnd)
	}
}
export class Requiescat extends BuffWindow {
	static override handle = 'requiescat'
	static override title = t('pld.requiescat.title')`Requiescat Usage`

	@dependency downtime!: Downtime
	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.REQUIESCAT

	private requiescatUsages = 0

	override initialise() {
		super.initialise()
		this.trackOnlyActions(REQUIESCAT_ACTIONS.map(g => this.data.actions[g].id))
		this.addEvaluator(new RequiescatGcdsEvaluator({
			expectedGcdCount: 4,
			allowedGcds: [
				this.data.actions.HOLY_SPIRIT.id,
				this.data.actions.HOLY_CIRCLE.id,
				this.data.actions.CONFITEOR.id,
				this.data.actions.BLADE_OF_FAITH.id,
				this.data.actions.BLADE_OF_TRUTH.id,
				this.data.actions.BLADE_OF_VALOR.id,
			],
			downtime: this.downtime,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.REQUIESCAT.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.wrong-gcd.content">
				GCDs used during <DataLink action="REQUIESCAT" /> should consist of <DataLink action="CONFITEOR" />
				, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />, and <DataLink action="BLADE_OF_VALOR" /> for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: SEVERITIES.MISSED_CASTS,
		}))
		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_VALOR, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.CONFITEOR.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.missed-confiteor.content">
				Be sure to use <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, and <DataLink action="BLADE_OF_VALOR" /> in each <DataLink status="REQUIESCAT" /> window for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: SEVERITIES.MISSED_CONFITEOR_GCDS,
			adjustCount: this.adjustExpectedConfiteorGCDCount.bind(this),
		}))

		this.addEventHook({type: 'action', source: this.parser.actor.id, action: this.data.actions.REQUIESCAT.id}, () => this.requiescatUsages++)
	}

	private adjustExpectedConfiteorGCDCount(window: HistoryEntry<EvaluatedAction[]>) {
		if (window.end == null) {
			return 0
		}

		const originalWindowEnd = window.start + REQUIESCAT_DURATION
		const downtimeInWindow = this.downtime.getDowntime(window.start, originalWindowEnd)
		const adjustedWindowEnd = originalWindowEnd - downtimeInWindow
		const adjustedWindowDuration = adjustedWindowEnd - window.start
		if (adjustedWindowDuration < this.globalCooldown.getDuration()) {
			return -1
		}

		return 0
	}

	override output() {
		return <Fragment>
			<Message>
				<Trans id="pld.requiescat.table.note">Each of your <DataLink status="REQUIESCAT" /> windows should contain 4 spells
				, consisting of <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, and <DataLink action="BLADE_OF_VALOR" /> for each each stack <DataLink status="REQUIESCAT" />.</Trans>
			</Message>
			<>{super.output()}</>
		</Fragment>
	}
}
