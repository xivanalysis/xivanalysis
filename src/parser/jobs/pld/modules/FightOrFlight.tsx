import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionGroupsEvaluator, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	MISSED_OGCDS: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
	},
	MISSED_ACTIONS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	MISSED_GCDS: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

// These GCDs should not count towards the FoF GCD counter, as they are not
// physical damage (weaponskill) GCDs.
const EXCLUDED_ACTIONS: ActionKey[] = [
	'CLEMENCY',
]

export class FightOrFlight extends BuffWindow {
	static override handle = 'fightorflight'
	static override title = t('pld.fightorflight.title')`Fight Or Flight Usage`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.FIGHT_OR_FLIGHT

	override initialise() {
		super.initialise()

		const suggestionWindowName = <DataLink action="FIGHT_OR_FLIGHT" showIcon={false} />

		this.ignoreActions(EXCLUDED_ACTIONS.map(g => this.data.actions[g].id))

		const actions = this.data.actions

		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon: this.data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcds.content">
				Try to land 8 GCDs during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_GCDS,
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: actions.GORING_BLADE, expectedPerWindow: 1},
				{action: actions.CONFITEOR, expectedPerWindow: 1},
				{action: actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: actions.BLADE_OF_VALOR, expectedPerWindow: 1},
			],
			suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcd_actions.content">
				Try to land at least one cast of <DataLink action="GORING_BLADE" />
				, <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, <DataLink action="BLADE_OF_VALOR" />, and the highest potency combination of <DataLink action="SEPULCHRE" />, <DataLink status="DIVINE_MIGHT" />
				empowered <DataLink action="HOLY_SPIRIT" />, <DataLink action="SUPPLICATION" />, <DataLink action="ATONEMENT" /> and <DataLink action="ROYAL_AUTHORITY" />
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_ACTIONS,
		}))

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [{
				actions: [
					actions.ROYAL_AUTHORITY,
					actions.ATONEMENT,
					actions.SUPPLICATION,
					actions.SEPULCHRE,
					actions.HOLY_SPIRIT,
				],
				expectedPerWindow: 3,
			}],
			suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcd_actions.content">
				Try to land at least one cast of <DataLink action="GORING_BLADE" />
				, <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, <DataLink action="BLADE_OF_VALOR" />, and the highest potency combination of <DataLink action="SEPULCHRE" />, <DataLink status="DIVINE_MIGHT" />
				empowered <DataLink action="HOLY_SPIRIT" />, <DataLink action="SUPPLICATION" />, <DataLink action="ATONEMENT" /> and <DataLink action="ROYAL_AUTHORITY" />
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_ACTIONS,
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: actions.BLADE_OF_HONOR, expectedPerWindow: 1},
				{action: actions.EXPIACION, expectedPerWindow: 1},
				{action: actions.CIRCLE_OF_SCORN, expectedPerWindow: 1},
				{action: actions.INTERVENE, expectedPerWindow: 1},
			],
			suggestionIcon: actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.ogcds.content">
				Try to land at least one cast of each of your off-GCD skills (<DataLink action="EXPIACION" />,
				<DataLink action="CIRCLE_OF_SCORN" />, and <DataLink action="INTERVENE" />)
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_OGCDS,
		}))
	}
}
