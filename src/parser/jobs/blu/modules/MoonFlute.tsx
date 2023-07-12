import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionGroupsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

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

const EXPECTED_GCD_COUNT = 5
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

export class MoonFlute extends BuffWindow {
	static override handle = 'moonflutes'
	static override title = t('blu.moonflutes.title')`Moon Flute Windows`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.WAXING_NOCTURNE

	override initialise() {
		super.initialise()

		const suggestionIcon = this.data.actions.MOON_FLUTE.icon
		const suggestionWindowName = <ActionLink action="MOON_FLUTE" showIcon={false}/>
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: EXPECTED_GCD_COUNT, // 4 GCDs + Phantom Flurry _or_ 5 GCDs
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="blu.moonflutes.suggestions.gcds.content">
				Regardless of spell speed, ideally a <ActionLink action="MOON_FLUTE" /> window should contain at least
					4 GCDs and end in <ActionLink action="PHANTOM_FLURRY" />. If you have higher latency this can
					be problematic. Changing your speed speed might help, and in a pinch you can try moving certain
					oGCDs out of the window (<ActionLink action="J_KICK" showIcon={false} />, <ActionLink action="GLASS_DANCE" showIcon={false} />,
				<ActionLink action="FEATHER_RAIN" showIcon={false} />), or replacing <ActionLink action="THE_ROSE_OF_DESTRUCTION" showIcon={false} />
					with a <ActionLink action="SONIC_BOOM" showIcon={false} />.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.TOO_FEW_GCDS,
			hasStacks: false,
		}))

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
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
			],
			suggestionIcon: suggestionIcon,
			suggestionWindowName: suggestionWindowName,
			suggestionContent: <Trans id="blu.moonflutes.suggestions.expected-actions.content">
				<ActionLink action="MOON_FLUTE" /> is only worth using if the buffed actions during the window
				will give you an extra 1260 potency (equivalent to casting <ActionLink action="SONIC_BOOM" showIcon={false} /> six times).
				The more of your larger cooldowns you can fit into the window, the better the result. High-priority targets
				are <ActionLink action="NIGHTBLOOM" showIcon={false} />, and finishing the combo with a <ActionLink action="PHANTOM_FLURRY" showIcon={false} />.
			</Trans>,
			severityTiers: SEVERITIES.MISSING_EXPECTED_USES,
		}))
	}
}

