import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Patch} from 'data/PATCHES'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionsEvaluator, ExpectedActionGroupsEvaluator, ExpectedGcdCountEvaluator} from 'parser/core/modules/ActionWindow'
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

		this.addExpectedActionsEvaluatorByPatch(this.parser.patch, suggestionWindowName)

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.EXPIACION, expectedPerWindow: 1},
				{action: this.data.actions.CIRCLE_OF_SCORN, expectedPerWindow: 1},
				{action: this.data.actions.INTERVENE, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.ogcds.content">
				Try to land at least one cast of each of your off-GCD skills (<DataLink action="EXPIACION" />,
				<DataLink action="CIRCLE_OF_SCORN" />, and <DataLink action="INTERVENE" />)
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_OGCDS,
		}))
	}

	private addExpectedActionsEvaluatorByPatch(patch: Patch, suggestionWindowName: JSX.Element) {
		if (patch.before('6.4')) {
			this.addExpectedActionsBefore6_4(suggestionWindowName)
		} else {
			this.addExpectedActionsAfter6_4(suggestionWindowName)
		}
	}

	private addExpectedActionsBefore6_4(suggestionWindowName: JSX.Element) {
		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.GORING_BLADE, expectedPerWindow: 1},
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_VALOR, expectedPerWindow: 1},
				{action: this.data.actions.HOLY_SPIRIT, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcd_actions.6.3.content">
				Try to land at least one cast of <DataLink action="GORING_BLADE" />
				, <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, <DataLink action="BLADE_OF_VALOR" />, and a <DataLink status="DIVINE_MIGHT" /> empowered <DataLink action="HOLY_SPIRIT" />
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_ACTIONS,
		}))
	}

	private addExpectedActionsAfter6_4(suggestionWindowName: JSX.Element) {
		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{actions: [this.data.actions.GORING_BLADE], expectedPerWindow: 1},
				{actions: [this.data.actions.CONFITEOR], expectedPerWindow: 1},
				{actions: [this.data.actions.BLADE_OF_FAITH], expectedPerWindow: 1},
				{actions: [this.data.actions.BLADE_OF_TRUTH], expectedPerWindow: 1},
				{actions: [this.data.actions.BLADE_OF_VALOR], expectedPerWindow: 1},
				{actions: [this.data.actions.HOLY_SPIRIT, this.data.actions.ATONEMENT, this.data.actions.ROYAL_AUTHORITY], expectedPerWindow: 3},
			],
			suggestionIcon: this.data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcd_actions.content">
				Try to land at least one cast of <DataLink action="GORING_BLADE" />
				, <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, <DataLink action="BLADE_OF_VALOR" />, and three casts of either <DataLink status="DIVINE_MIGHT" /> empowered <DataLink action="HOLY_SPIRIT" />
				, <DataLink action="ATONEMENT" />, or <DataLink action="ROYAL_AUTHORITY" /> during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_ACTIONS,
		}))
	}
}
