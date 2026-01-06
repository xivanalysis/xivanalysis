import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, NotesEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {DISPLAY_ORDER} from 'parser/jobs/gnb/modules/DISPLAY_ORDER'
import {Message} from 'semantic-ui-react'

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

//At a minimum 3 carts will be used under No Mercy, if GNB is going fast, a 4th cart may be used TODO: Confirm Burst Strike's expectations
const EXPECTED_USES = {
	DOUBLE_DOWN: 1,
	GNASHING_FANG: 0, //This is to handle 2 Cart bursts
	SAVAGE_CLAW: 1,
	WICKED_TALON: 1,
	SONIC_BREAK: 1,
	BLASTING_ZONE: 1,
	BOW_SHOCK: 1,
	LION_HEART: 0,
	GCD: 9,
	GCD_SLOW: 8,

	// Don't check for correct Continuations; that will be covered by the Continuation module.
}
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
	static override title = msg({id: 'gnb.nomercy.title', message: 'No Mercy Windows'})
	static override displayOrder = DISPLAY_ORDER.NO_MERCY

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.NO_MERCY

	override prependMessages = <Message info>
		<p>
			<Trans id="gnb.nomercy.prepend-message.intro">
				Gunbreaker has a small dps optimization technique that can be done by using the extra charge of <ActionLink action="GNASHING_FANG"/> from the half minute of your rotation in order to enter <ActionLink action="NO_MERCY"/> at the following times:
			</Trans>
		</p>
		<ul>
			<li>
				<Trans id="gnb.nomercy.prepend-message.slow-gcd">
					If you are running at a slower GCD (2.47 or slower), you will only do 8 GCDs under <ActionLink action="NO_MERCY"/> so you will use <ActionLink action="NO_MERCY"/> right before a <ActionLink action="CONTINUATION"/>, ideally <ActionLink action="EYE_GOUGE"/>.
				</Trans>
			</li>
			<li>
				<Trans id="gnb.nomercy.prepend-message.fast-gcd">
					If you are running at a faster GCD (2.46 or faster), you will do a full 9 GCDs under <ActionLink action="NO_MERCY"/> so you will use <ActionLink action="NO_MERCY"/> right before a weaponskill in the combo and its follow up <ActionLink action = "CONTINUATION"/>, ideally <ActionLink action="WICKED_TALON"/>.
				</Trans>
			</li>
		</ul>
		<p>
			<Trans id="gnb.nomercy.prepend-message.infographic">
				Please see the rotation infographic by Krom at the top of this page for more information.
			</Trans>
		</p>
		<p>
			<Trans id="gnb.nomercy.prepend-message.disclaimer">
				This technique is not always possible or correct in the event that <ActionLink action="NO_MERCY"/> is interrupted, and as such the <ActionLink action="NO_MERCY"/> module does not expect it, but this technique should be used whenever you can.
			</Trans>
		</p>
	</Message>

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
					action: this.data.actions.SAVAGE_CLAW,
					expectedPerWindow: EXPECTED_USES.SAVAGE_CLAW,
				},
				{
					action: this.data.actions.WICKED_TALON,
					expectedPerWindow: EXPECTED_USES.WICKED_TALON,
				},

				{
					action: this.data.actions.DOUBLE_DOWN,
					expectedPerWindow: EXPECTED_USES.DOUBLE_DOWN,
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
					action: this.data.actions.LION_HEART,
					expectedPerWindow: EXPECTED_USES.LION_HEART,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="gnb.nomercy.suggestions.expected-uses.content">
				Watch your uses of certain abilities during <ActionLink action="NO_MERCY" />. Under ideal conditions, you should
					be using <ActionLink action="SONIC_BREAK" />, a full <ActionLink action="GNASHING_FANG" /> combo, and all of
					your off-GCD skills <ActionLink action="BLASTING_ZONE" />, <ActionLink action="BOW_SHOCK" />.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSING_EXPECTED_USES,
			adjustCount: this.adjustExpectedActionCount.bind(this),
		}))

		if (this.parser.patch.before('7.3')) { // As of patch 7.4, Every Burst Window should have Bloodfest used in it.
			this.addEvaluator(new BloodfestEvaluator(this.data.actions.BLOODFEST.id))
		}
	}

	private adjustExpectedActionCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {

		//If Rushing, toss expected GCDs out the window
		if (this.isRushedEndOfPullWindow(window)) {
			if (action.action.id !== this.data.actions.LION_HEART.id && action.action.id !== this.data.actions.GNASHING_FANG.id) {
				return -1
			}
		} else if (!this.isRushedEndOfPullWindow(window)) {
			// TODO: Make better 2 cart implementation, scope creep for this module has removed it from initial support, if fastGNB remains a thing, it will be added.
			// Gnashing Fang is adjusted in 2 cases:
			// 1. If the user is running slower than the GCD_SLOW, Gnashing Fang is expected.
			// 2. If the user casts it it was expected. (This is covering the edge case of 2.47 or faster GNB may use GF before NM for a dps gain, hence why the default is 0.
			if (action.action.id === this.data.actions.GNASHING_FANG.id) {
				if (this.globalCooldown.getDuration() > GCD_SLOW) {
					return 1
				}

				if (window.data.find(cast => cast.action.id === this.data.actions.GNASHING_FANG.id)) {
					return 1
				}
			}

			if (this.parser.patch.before('7.4')) {
				//LionHeart Adjusts in 2 ways:
				// 1. If Bloodfest is used, Lion Heart is expected
				// 2. If Lion Heart is used, Lion Heart is expected, this is an edge case where Bloodfest was used before No Mercy.
				if (action.action.id === this.data.actions.LION_HEART.id) {
					if (window.data.find(cast => cast.action.id === this.data.actions.BLOODFEST.id)) {
						return 1
					}
					if ((window.data.find(cast => cast.action.id !== this.data.actions.BLOODFEST.id)) && window.data.find(cast => cast.action.id === this.data.actions.LION_HEART.id)) {
						return 1
					}
				}
				//Adjust nothing else besides Lion Heart and Gnashing Fang
				if (action.action.id !== this.data.actions.LION_HEART.id) { return 0 }
			} else if (action.action.id === this.data.actions.LION_HEART.id) {
				// Post 7.4, Lion Heart is always expected in a No Mercy window.
				return 1
			}
		}

		return 0
	}
}
