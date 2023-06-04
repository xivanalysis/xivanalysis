import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Patch} from 'data/PATCHES'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, ExpectedActionsEvaluator, ExpectedActionGroupsEvaluator, ExpectedGcdCountEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {Data} from 'parser/core/modules/Data'
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

		const expectedActionsEvaluatorCreator = this.addExpectedActionsEvaluatorByPatch(this.parser.patch)
		this.addEvaluator(expectedActionsEvaluatorCreator(this.data, suggestionWindowName))

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

	private addExpectedActionsEvaluatorByPatch(patch: Patch) : (data: Data, suggestionWindowName: JSX.Element) => WindowEvaluator {
		if (patch.before('6.4')) {
			return this.addExpectedActionsBefore6_4
		}
		return this.addExpectedActionsAfter6_4
	}

	private addExpectedActionsBefore6_4(data: Data, suggestionWindowName: JSX.Element) {
		return new ExpectedActionsEvaluator({
			expectedActions: [
				{action: data.actions.GORING_BLADE, expectedPerWindow: 1},
				{action: data.actions.CONFITEOR, expectedPerWindow: 1},
				{action: data.actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: data.actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: data.actions.BLADE_OF_VALOR, expectedPerWindow: 1},
				{action: data.actions.HOLY_SPIRIT, expectedPerWindow: 1},
			],
			suggestionIcon: data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcd_actions.6.3.content">
				Try to land at least one cast of <DataLink action="GORING_BLADE" />
				, <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, <DataLink action="BLADE_OF_VALOR" />, and a <DataLink status="DIVINE_MIGHT" /> empowered <DataLink action="HOLY_SPIRIT" />
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_ACTIONS,
		})
	}

	private addExpectedActionsAfter6_4(data: Data, suggestionWindowName: JSX.Element) {
		return new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{actions: [data.actions.GORING_BLADE], expectedPerWindow: 1},
				{actions: [data.actions.CONFITEOR], expectedPerWindow: 1},
				{actions: [data.actions.BLADE_OF_FAITH], expectedPerWindow: 1},
				{actions: [data.actions.BLADE_OF_TRUTH], expectedPerWindow: 1},
				{actions: [data.actions.BLADE_OF_VALOR], expectedPerWindow: 1},
				{actions: [data.actions.HOLY_SPIRIT, data.actions.ATONEMENT, data.actions.ROYAL_AUTHORITY], expectedPerWindow: 3},
			],
			suggestionIcon: data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcd_actions.content">
				Try to land at least one cast of <DataLink action="GORING_BLADE" />
				, <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, <DataLink action="BLADE_OF_VALOR" />, and three casts of either <DataLink status="DIVINE_MIGHT" /> empowered <DataLink action="HOLY_SPIRIT" />
				, <DataLink action="ATONEMENT" />, or <DataLink action="ROYAL_AUTHORITY" /> during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_ACTIONS,
		})
	}
}
