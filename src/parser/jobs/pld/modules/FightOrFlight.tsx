import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action, ActionKey} from 'data/ACTIONS'
import _ from 'lodash'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, ExpectedGcdCountEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	MISSED_OGCDS: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
		10: SEVERITY.MAJOR,
	},
	MISSED_GORING: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	MISSED_GCD: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
	GORING_CLIP: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		4: SEVERITY.MAJOR,
	},
}

const MINIMUM_GORING_DISTANCE = 9

// These GCDs should not count towards the FoF GCD counter, as they are not
// physical damage (weaponskill) GCDs.
const EXCLUDED_ACTIONS: ActionKey[] = [
	'CLEMENCY',
	'HOLY_SPIRIT',
	'HOLY_CIRCLE',
	'CONFITEOR',
	'BLADE_OF_FAITH',
	'BLADE_OF_TRUTH',
	'BLADE_OF_VALOR',
	'REQUIESCAT',
]

class GoringBladeSpacingEvaluator implements WindowEvaluator {
	// Because this class is not an Analyser, it cannot use Data directly to get the id or icon for Goring Blade, so require the action object in the constructor
	private goringBlade: Action

	constructor (goringBlade: Action) {
		this.goringBlade = goringBlade
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const goringTooClose = windows
			.reduce((total, window) => {
				const gcdsInWindow = window.data.filter(cast => (cast.action.onGcd ?? false))
				const firstGoring = _.findIndex(gcdsInWindow, gcd => gcd.action.id === this.goringBlade.id)
				if (firstGoring === -1) {
					return total
				}

				const secondGoring = _.findIndex(gcdsInWindow, gcd => gcd.action.id === this.goringBlade.id, firstGoring + 1)
				if (secondGoring === -1) {
					return total
				}

				return total + ((secondGoring - firstGoring) < MINIMUM_GORING_DISTANCE ? 1 : 0)
			}, 0)

		return new TieredSuggestion({
			icon: this.goringBlade.icon,
			content: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.content">
				Try to refresh <DataLink action="GORING_BLADE" /> 9 GCDs after the
				first <DataLink action="GORING_BLADE" /> in
				a <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			why: <Trans id="pld.fightorflight.suggestions.goring-blade-clip.why">
				<Plural value={goringTooClose} one="# application was" other="# applications were"/> refreshed too early during <DataLink status="FIGHT_OR_FLIGHT" /> windows.
			</Trans>,
			tiers: SEVERITIES.GORING_CLIP,
			value: goringTooClose,
		})
	}

	output() {
		return undefined
	}
}

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
			expectedGcds: 11,
			globalCooldown: this.globalCooldown,
			suggestionIcon: this.data.actions.FIGHT_OR_FLIGHT.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.gcds.content">
				Try to land 11 physical GCDs during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_GCD,
		}))

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.EXPIACION, expectedPerWindow: 1},
				{action: this.data.actions.CIRCLE_OF_SCORN, expectedPerWindow: 1},
				{action: this.data.actions.INTERVENE, expectedPerWindow: 1},
				{action: this.data.actions.GORING_BLADE, expectedPerWindow: 2},
				{action: this.data.actions.ATONEMENT, expectedPerWindow: 3},
			],
			suggestionIcon: this.data.actions.EXPIACION.icon,
			suggestionContent: <Trans id="pld.fightorflight.suggestions.ogcds.content">
				Try to land at least one cast of each of your physical off-GCD skills (<DataLink action="EXPIACION" />,
				<DataLink action="CIRCLE_OF_SCORN" />, and <DataLink action="INTERVENE" />), two <DataLink action="GORING_BLADE" /> applications, and three casts of <DataLink action ="ATONEMENT" />
				during every <DataLink action="FIGHT_OR_FLIGHT" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.MISSED_OGCDS,
		}))

		this.addEvaluator(new GoringBladeSpacingEvaluator(this.data.actions.GORING_BLADE))
	}
}
