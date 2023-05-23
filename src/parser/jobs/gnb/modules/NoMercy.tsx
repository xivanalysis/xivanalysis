import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, NotesEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	MISSING_EXPECTED_USES: {
		1: SEVERITY.MINOR,
		4: SEVERITY.MEDIUM,
		8: SEVERITY.MAJOR,
	},

	TOO_FEW_GCDS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

const GCD_SLOW = 2.47

const EXPECTED_USES = {
	DOUBLE_DOWN: 1, //This is assuming that you enter NM with 3 carts: 1 cart: Gnashing, 2 carts: Double Down
	BURST_STRIKE: 1,
	GNASHING_FANG: 1,
	SONIC_BREAK: 1,
	ROUGH_DIVIDE: 1,
	BLASTING_ZONE: 1,
	BOW_SHOCK: 1,
	GCD: 9,
	GCD_SLOW: 8,

	// Don't check for correct Continuations; that will be covered by the Continuation module.
	// Don't check for correctness on the Gnashing Fang combo; that's covered by the built-in Combo tracker.
}

const openerGracePeriod = 22500 //Perhaps I'm being overly generous, but after 9 regular gcds a proper full burst could be done.

class BloodfestEvaluator extends NotesEvaluator {

	// Because this class is not an Analyser, it cannot use Data directly
	// to get the id for Bloodfest, so it has to take it in here.
	private bloodfestId: number

	constructor(bloodfestId: number) {
		super()
		this.bloodfestId = bloodfestId
	}

	header = {
		header: <Trans id="gnb.nomercy.notes.header">Bloodfest Used</Trans>,
		accessor: 'bloodfestused',
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>) {
		return window.data.find(cast => cast.action.id === this.bloodfestId) ?
			<Trans id="gnb.nomercy.chart.notes.yes">Yes</Trans> : <Trans id = "gnb.nomercy.chart.notes.no">No</Trans>

	}
}

export class NoMercy extends BuffWindow {
	static override handle = 'nomercy'
	static override title = t('gnb.nomercy.title')`No Mercy Windows`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.NO_MERCY

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.NO_MERCY.icon
		const suggestionWindowName = <ActionLink action="NO_MERCY" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_USES.GCD,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent: <Trans id="gnb.nomercy.suggestions.gcds.content">
				Try to land {EXPECTED_USES.GCD} weaponskills ({EXPECTED_USES.GCD_SLOW} weaponskills at {GCD_SLOW} GCD or slower) during every <ActionLink action="NO_MERCY" /> window.
					A 20 second duration fits all weaponskills with full uptime if you wait until the last third of your GCD timer to activate <ActionLink action="NO_MERCY" />.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.TOO_FEW_GCDS,
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.GNASHING_FANG,
					expectedPerWindow: EXPECTED_USES.GNASHING_FANG,
				},

				{
					action: this.data.actions.DOUBLE_DOWN,
					expectedPerWindow: EXPECTED_USES.DOUBLE_DOWN,
				},
				{
					action: this.data.actions.BURST_STRIKE,
					expectedPerWindow: EXPECTED_USES.BURST_STRIKE,
				},
				{
					action: this.data.actions.SONIC_BREAK,
					expectedPerWindow: EXPECTED_USES.SONIC_BREAK,
				},

				{
					action: this.data.actions.BLASTING_ZONE,
					expectedPerWindow: EXPECTED_USES.BLASTING_ZONE,
				},

				{
					action: this.data.actions.BOW_SHOCK,
					expectedPerWindow: EXPECTED_USES.BOW_SHOCK,
				},

				{
					action: this.data.actions.ROUGH_DIVIDE,
					expectedPerWindow: EXPECTED_USES.ROUGH_DIVIDE,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="gnb.nomercy.suggestions.expected-uses.content">
				Watch your uses of certain abilities during <ActionLink action="NO_MERCY" />. Under ideal conditions, you should
					be using <ActionLink action="SONIC_BREAK" />, a full <ActionLink action="GNASHING_FANG" /> combo, and all of
					your off-GCD skills <ActionLink action="BLASTING_ZONE" />, <ActionLink action="BOW_SHOCK" />, and at least one
					charge of <ActionLink action="ROUGH_DIVIDE" /> under the buff duration.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSING_EXPECTED_USES,
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))

		this.addEvaluator(new BloodfestEvaluator(this.data.actions.BLOODFEST.id))
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		if (action.action.id !== this.data.actions.BURST_STRIKE.id) { return 0 }

		if (window.data.find(cast => cast.action.id === this.data.actions.BLOODFEST.id) && window.start > (this.parser.pull.timestamp + openerGracePeriod)) {
			//Outside of opener, all Bloodfest NM bursts should have 6 ammo uses, 1 for GF combo 2 for DD and 3 for BS
			return 2
		}

		return 0
	}

}
