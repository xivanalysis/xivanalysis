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

		const expectedActionsEvaluatorCreator = this.selectExpectedActionsEvaluatorCreator(this.parser.patch)
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

	/**
	 * Selects the Expected Actions Evaluator Creator depending on the patch.
	 *
	 * Patch 6.4 made it so that Atonement no longer breaks combos. Thus we can
	 * improve the FoF window by always using higher potency actions.
	 *
	 * @param patch of the report to be analyzed
	 * @returns Method to create the expected actions evaluator
	 */
	private selectExpectedActionsEvaluatorCreator(patch: Patch) : (data: Data, suggestionWindowName: JSX.Element) => WindowEvaluator {
		if (patch.before('6.4')) {
			return this.createExpectedActionsEvaluatorBefore6_4
		}
		return this.createExpectedActionsEvaluatorAfter6_4
	}

	/**
	 * Creates the expected actions evaluator for 6.3 and before.
	 *
	 * Due to atonement breaking combo we only try to get at least one holy spirit
	 * in our combo. But the two other actions may, depending on the part of the rotation
	 * we're currently in, be a Fast Blade and Riot Blade and thus consist of low potency
	 * skills.
	 *
	 * @param data of all actions
	 * @param suggestionWindowName to use
	 * @returns ExpectedActionEvaluator for 6.3 and before
	 */
	private createExpectedActionsEvaluatorBefore6_4(data: Data, suggestionWindowName: JSX.Element): WindowEvaluator {
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

	/**
	 * Creates the expected actions evaluator for 6.4 onwards.
	 *
	 * Due to atonement no longer breaking combo we can have 3 higher potency actions
	 * in our fight or flight window.
	 *
	 * @param data of all actions
	 * @param suggestionWindowName to use
	 * @returns ExpectedActionEvaluator for 6.4 onwards
	 */
	private createExpectedActionsEvaluatorAfter6_4(data: Data, suggestionWindowName: JSX.Element): WindowEvaluator {
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
