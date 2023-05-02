import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
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
			expectedGcds: 5, // 4 GCDs + Phantom Flurry _or_ 5 GCDs
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="blue.moonflutes.suggestions.gcds.content">
                Regardless of spell speed, ideally a <ActionLink action="MOON_FLUTE" /> window should contain at least
                    4 GCDs and end in <ActionLink action="PHANTOM_FLURRY" />.  If you have higher latency this can
                    be problematic; changing your speed speed might help, and in a pinch you can try moving certain
                    oGCDs out of the window (<ActionLink action="J_KICK" />, <ActionLink action="GLASS_DANCE" />,
				<ActionLink action="FEATHER_RAIN" />), or replacing <ActionLink action="THE_ROSE_OF_DESTRUCTION" />
                    with a <ActionLink action="SONIC_BOOM" />.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.TOO_FEW_GCDS,
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{
					action: this.data.actions.TRIPLE_TRIDENT,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.NIGHTBLOOM,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.THE_ROSE_OF_DESTRUCTION,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.SHOCK_STRIKE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.BRISTLE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.GLASS_DANCE,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.SURPANAKHA,
					expectedPerWindow: 4,
				},
				{
					action: this.data.actions.FEATHER_RAIN,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.MATRA_MAGIC,
					expectedPerWindow: 1,
				},
				{
					action: this.data.actions.PHANTOM_FLURRY,
					expectedPerWindow: 1,
				},
			],
			suggestionIcon,
			suggestionContent: <Trans id="blu.moonflutes.suggestions.expected-uses.content">
				<ActionLink action="MOON_FLUTE" /> is only worth using if the buffed actions during the window
                will give you an extra 1260 potency (equivalent to casting <ActionLink action="SONIC_BOOM" /> six times).
                The more of your larger cooldowns you can fit into the window, the better the result.  High-priority targets
                are <ActionLink action="NIGHTBLOOM" />, and finishing the combo with a <ActionLink action="PHANTOM_FLURRY" />.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSING_EXPECTED_USES,
		}))
	}

}
