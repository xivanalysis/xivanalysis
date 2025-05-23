import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator, TrackedAction} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {EndOfWindowHandlingMode} from 'parser/core/modules/ActionWindow/windows/BuffWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SEVERITIES = {
	MISSED_GCDS: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	WRONG_GCDS: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

export class Delirium extends BuffWindow {
	static override handle = 'delirium'
	static override title = msg({id: 'drk.delirium.title', message: 'Delirium Usage'})
	static override displayOrder = DISPLAY_ORDER.DELIRIUM

	override buffStatus = this.data.statuses.DELIRIUM
	override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	@dependency globalCooldown!: GlobalCooldown

	override initialise() {
		super.initialise()

		const suggestionWindowName = <DataLink action="DELIRIUM" showIcon={false} />

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.SCARLET_DELIRIUM, expectedPerWindow: 1},
				{action: this.data.actions.COMEUPPANCE, expectedPerWindow: 1},
				{action: this.data.actions.TORCLEAVER, expectedPerWindow: 1},
				{action: this.data.actions.IMPALEMENT, expectedPerWindow: 3},
			],
			suggestionIcon: this.data.actions.DELIRIUM.icon,
			suggestionContent: <Trans id="drk.delirium.suggestions.gcdactions.content">
				Each <DataLink action="DELIRIUM" /> window should contain <DataLink action="SCARLET_DELIRIUM" />, <DataLink action="COMEUPPANCE" />, and <DataLink action="TORCLEAVER" />, or three <DataLink action="IMPALEMENT" />s.
				Using non-Delirium combo actions resets your Delirium combo progress and causes you to lose the increased potency of the comboed skills.
			</Trans>,
			suggestionWindowName,
			severityTiers: SEVERITIES.WRONG_GCDS,
			adjustCount: this.adjustCount.bind(this),
		}))
	}

	private adjustCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		const scarletUsed = window.data.filter(event => (event.action.id === this.data.actions.SCARLET_DELIRIUM.id)).length
		const comeuppanceUsed = window.data.filter(event => (event.action.id === this.data.actions.COMEUPPANCE.id)).length
		const torcleaverUsed = window.data.filter(event => (event.action.id === this.data.actions.TORCLEAVER.id)).length

		// Reduce required impalements by number of single target actions used
		if (action.action.id === this.data.actions.IMPALEMENT.id) {
			return -(scarletUsed + comeuppanceUsed + torcleaverUsed)
		}

		const totalNumberOfDeliriumStacks = 3
		const impalementUsed = window.data.filter(event => (event.action.id === this.data.actions.IMPALEMENT.id)).length
		// This will allow the following mixtures of AoE/single target:
		// - 2x Impalement, 1x Scarlet Delirium
		// - 1x Scarlet Delirium, 1x Comeuppance, 1x Impalement
		// Anything else (e.g. 2x Scarlet Delirium, 1x Impalement) is disallowed
		if (impalementUsed === totalNumberOfDeliriumStacks) {
			if (action.action.id === this.data.actions.TORCLEAVER.id) {
				return -1
			}
		}

		if (impalementUsed >= 2) {
			if (action.action.id === this.data.actions.COMEUPPANCE.id) {
				return -1
			}
		}

		if (impalementUsed >= 1) {
			if (action.action.id === this.data.actions.SCARLET_DELIRIUM.id) {
				return -1
			}
		}

		return 0
	}
}
