import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTargetOutcome} from 'components/ui/RotationTable'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, TrackedActionGroup, ExpectedActionGroupsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SEVERITIES = {
	MISSING_EXPECTED_USES: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},

	TOO_FEW_GCDS: {
		8: SEVERITY.MAJOR,
	},
}

const EXPECTED_GCD_COUNT_LEVEL_70 = 5
const EXPECTED_GCD_COUNT_LEVEL_80 = 6
// Some notes on the expected GCD count.
// Waxing Nocturne is 15 seconds, so that seems like
// it should be 6 GCDs, but the first .5 seconds you are still
// in GCD recast time, so it's more like 14.5 seconds.
//
// If you are running very high spell speed, it is actually
// possible to get those 6 GCDs, but that's not the entire story!
//
// If you just cats Moon Flute and then do 6 GCDs, then no matter
// how strong those GCDs are -- even if they are 6 Revenge Blasts --
// it will be a potency loss compared to 6 Revenge Blasts + 6 Sonic Booms.
//
// So while GCDs are as usual important, the big deal in a Moon Flute
// window is weaving in as many oGCDs as we can *without* dropping a
// GCD cast.
//
// And so our standard moon flute window actually only has us cast 4
// GCDs (Triple Trident, The Rose of Destruction, Bristle, Matra Magic)
// while giving up ~5 seconds to purposely clipping with oGCDs;
// 3.6 seconds of Surpanakha, and the rest is all hard clips and
// purposeful multi-weaves.
//
// ...but for implementation details, Phantom Flurry is marked as a GCD,
// so even though we technically only do 4 GCDs in the window, we are
// looking for a pseudo-5th, Phantom Flurry.
//
// Also, if they used Final Sting, then we window can be as short as a single
// GCD!
const neutralOrPositiveOutcome = (actual: number, expected?: number) => {
	if (expected !== undefined && actual === expected) {
		return RotationTargetOutcome.POSITIVE
	}
	return RotationTargetOutcome.NEUTRAL
}

export class MoonFlute extends BuffWindow {
	static override handle = 'moonflutes'
	static override title = t('blu.moonflutes.title')`Moon Flute Windows`
	static override displayOrder = DISPLAY_ORDER.MOON_FLUTE

	@dependency globalCooldown!: GlobalCooldown
	@dependency private cooldowns!: Cooldowns

	override buffStatus = this.data.statuses.WAXING_NOCTURNE

	private windowMissedTT = new Set<number>()
	private breathOfMagicApplier: boolean = false

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		// Add a Waning Moon hook, essentially telling us exactly when a MF window ended.
		const extraFilter = playerFilter.type('statusApply')
			.status(this.data.statuses.WANING_NOCTURNE.id)
		this.addEventHook(extraFilter, this.onWaningNocturneApply)

		const bomFilter = playerFilter.type('action')
			.action(this.data.actions.BREATH_OF_MAGIC.id)
		this.addEventHook(bomFilter, this.onCastBreathOfMagic)

		const level80BLU = this.parser.patch.after('6.4')
		const bluLevel70MoonFlute = [
			{
				actions: [this.data.actions.J_KICK, this.data.actions.QUASAR],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.TRIPLE_TRIDENT],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.NIGHTBLOOM],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.THE_ROSE_OF_DESTRUCTION],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.SHOCK_STRIKE, this.data.actions.BLU_MOUNTAIN_BUSTER],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.BRISTLE],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.GLASS_DANCE],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.SURPANAKHA],
				expectedPerWindow: 4,
			},
			{
				actions: [this.data.actions.FEATHER_RAIN, this.data.actions.ERUPTION],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.MATRA_MAGIC],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.PHANTOM_FLURRY],
				expectedPerWindow: 1,
			},
		]

		const bluLevel80MoonFlute = [
			{
				actions: [this.data.actions.J_KICK, this.data.actions.QUASAR],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.TRIPLE_TRIDENT],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.NIGHTBLOOM],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.SHOCK_STRIKE, this.data.actions.BLU_MOUNTAIN_BUSTER],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.SEA_SHANTY],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.BEING_MORTAL],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.SURPANAKHA],
				expectedPerWindow: 4,
			},
			{
				actions: [this.data.actions.FEATHER_RAIN, this.data.actions.ERUPTION],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.MATRA_MAGIC],
				expectedPerWindow: 1,
			},
			{
				actions: [this.data.actions.PHANTOM_FLURRY],
				expectedPerWindow: 1,
			},
		]
		const suggestionIcon = this.data.actions.MOON_FLUTE.icon
		const suggestionWindowName = <ActionLink action="MOON_FLUTE" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: level80BLU ? EXPECTED_GCD_COUNT_LEVEL_80 : EXPECTED_GCD_COUNT_LEVEL_70, // 4 GCDs + Phantom Flurry _or_ 5 GCDs
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="blu.moonflutes.suggestions.gcds.content">
				A <ActionLink action="MOON_FLUTE" showIcon={false} showTooltip={false} /> window should contain at least
				4 GCDs and end in <ActionLink action="PHANTOM_FLURRY" />. If you have higher latency this can
				be problematic. Changing your speed speed might help, and in a pinch you can try moving certain
				oGCDs out of the window (<ActionLink action="J_KICK" showIcon={false} />
				, <ActionLink action="FEATHER_RAIN" showIcon={false} />), or replacing 2-second cast time GCDs
				with 1-second GCDs like <ActionLink action="SONIC_BOOM" showIcon={false} />.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.TOO_FEW_GCDS,
			hasStacks: false,
			adjustCount: this.adjustExpectedGcdCount.bind(this),
		}))

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: level80BLU ? bluLevel80MoonFlute : bluLevel70MoonFlute,
			suggestionIcon: suggestionIcon,
			suggestionWindowName: suggestionWindowName,
			suggestionContent: <Trans id="blu.moonflutes.suggestions.expected-actions.content">
				<ActionLink action="MOON_FLUTE" showIcon={false} /> is only worth using if the buffed actions during the window
				will give you an extra 1260 potency (equivalent to casting <ActionLink action="SONIC_BOOM" showIcon={false} /> six times).
				The more of your larger cooldowns you can fit into the window, the better the result. High-priority targets
				are <ActionLink action="NIGHTBLOOM" showIcon={false} />, and finishing the combo with a <ActionLink action="PHANTOM_FLURRY" showIcon={false} />.
				<br />
				The odd-minute <ActionLink action="MOON_FLUTE" showIcon={false} showTooltip={false} /> from
				the <ActionLink action="BREATH_OF_MAGIC" showIcon={false} /> applier is exempt from this check.
			</Trans>,
			severityTiers: SEVERITIES.MISSING_EXPECTED_USES,
			adjustOutcome: this.adjustExpectedActionOutcome.bind(this),
		}))
	}

	private finalStingsUsedInWindow(window: HistoryEntry<EvaluatedAction[]>): number {
		const finalStingUsed = window.data.filter(event => (event.action.id === this.data.actions.FINAL_STING.id || event.action.id === this.data.actions.SELF_DESTRUCT.id)).length
		return finalStingUsed
	}

	private onCastBreathOfMagic() {
		this.breathOfMagicApplier = true
	}

	private onWaningNocturneApply() {
		// This will be 0 if TT is available, and some number of milliseconds otherwise
		const ttCd = this.cooldowns.remaining('TRIPLE_TRIDENT')
		if (ttCd > 0) { return }

		// They just finished a MF window and TT was available.  This is a Big Loss(tm);
		// for Spell Speed builds this means they missed aligning their TT with the 6m
		// MF window, and for Crit builds they just lost a ton of damage.
		const current = this.history.getCurrent()
		if (current == null) { return }
		this.windowMissedTT.add(current.start)
	}

	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		const finalStingUsed = this.finalStingsUsedInWindow(window)
		return finalStingUsed >= 1 ? (-window.data.length+1) : 0
	}

	private adjustExpectedActionOutcome(window: HistoryEntry<EvaluatedAction[]>, trackedActions: TrackedActionGroup) {
		const finalStingUsed = this.finalStingsUsedInWindow(window)
		if (finalStingUsed !== 0) {
			// Final Sting used, so don't dock any points for missed actions:
			return neutralOrPositiveOutcome
		}

		// Final Sting not used here
		if (this.breathOfMagicApplier) {
			// It's the Breath of Magic applier!  They may be doing an off-minute window to
			// reapply BoM, and we should not dock them any points for that.
			if (this.offMinuteBoMMoonFlute(window)) {
				// TODO: We should actually still enforce that Surpanakha should either be 4 casts or 0, nothing else.
				return neutralOrPositiveOutcome
			}
		}

		// For SpS builds, using Triple Trident on cooldown is a DPS gain, so
		// jump through hoops to accommodate for that:
		const trackedActionId = trackedActions.actions[0].id
		if (trackedActionId === this.data.actions.TRIPLE_TRIDENT.id) {
			// Using TT on cooldown, on a long enough timeline, can be a DPS gain over
			// holding it for a MF window, particularly for SpS builds.
			// So let's be understanding -- We only dock points if they were in a
			// Moon Flute window, had TT available, and didn't use it.
			if (!this.windowMissedTT.has(window.start)) {
				// TT was either used, or wasn't available during the window.
				// Either way, this check will either be a Positive or a Neutral,
				// never a negative.
				return neutralOrPositiveOutcome
			}
		}
		// Default handling:
		return
	}

	private offMinuteBoMMoonFlute(window: HistoryEntry<EvaluatedAction[]>): boolean {
		// We only relax the requirements for off-minute Moon Flutes that reapply BoM:
		const bomCasts = window.data.filter(event => event.action.id === this.data.actions.BREATH_OF_MAGIC.id).length
		if (bomCasts < 1) { return false }

		// So how can we tell if it's an off-minute window?
		// Everyone's favorite: Heuristics!  If Nightbloom is still in cooldown,
		// and will be in cooldown by the end of the Moon Flute, assume it's an odd-minute flute.
		// NOTE: Initially we were checking for a Moon Flute that used both BoM and
		// Song of Torment, but it's possible -- though not recommended -- that they didn't
		// take Song of Torment.
		const nightbloomHistory = this.cooldowns.cooldownHistory(this.data.actions.NIGHTBLOOM) ?? []
		for (const nightbloomCast of nightbloomHistory) {
			const mfEnd = window.end ?? (window.start + this.data.statuses.WAXING_NOCTURNE.duration)
			if (nightbloomCast.start > window.start && nightbloomCast.start < mfEnd) {
				// This nightbloom happened during this MF, assume it's an even-minute
				continue
			}
			const bloomOffCd = nightbloomCast.start + this.data.actions.NIGHTBLOOM.cooldown
			if (nightbloomCast.start < window.start && bloomOffCd > (mfEnd + this.data.statuses.WANING_NOCTURNE.duration)) {
				// We had a nightbloom that happened before this window, but comes off cooldown
				// after this MF is over.  Assume that this is an odd-minute MF, so accept them
				// doing whatever they want for the oGCD spam.
				return true
			}
		}

		return false
	}
}

