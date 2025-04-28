import {Plural, Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {assignErrorCode} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS} from './WatchdogConstants'
import {ASTRAL_UMBRAL_MAX_STACKS, Gauge} from '../Gauge'

export interface ManafontTimingEvaluatorOpts {
	manafontAction: Action
	despairId: number
	metadataHistory: History<CycleMetadata>
	requiredMP: number
	flareId: number,
	gauge: Gauge
	actors: Actors
}

export class ManafontTimingEvaluator extends RulePassedEvaluator {
	private manafontAction: Action
	private despairId: number
	private metadataHistory: History<CycleMetadata>
	private requiredMP: number
	private flareId: number
	private gauge: Gauge
	private actors: Actors

	override header = undefined

	constructor(opts: ManafontTimingEvaluatorOpts) {
		super()

		this.manafontAction = opts.manafontAction
		this.despairId = opts.despairId
		this.metadataHistory = opts.metadataHistory
		this.requiredMP = opts.requiredMP
		this.flareId = opts.flareId
		this.gauge = opts.gauge
		this.actors = opts.actors
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		// If this is a window that did not contain Manafont, then this analysis does not apply. Skip it.
		const manafontIndex = window.data.findIndex(event => event.action.id === this.manafontAction.id)
		if (manafontIndex <= 0) { return }

		const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)?.data
		if (windowMetadata == null) { return }

		const manafontTimestamp = window.data[manafontIndex].timestamp

		// If Manafont was used to reach Astral Fire, it's a neutral result
		if (this.gauge.getGaugeState(manafontTimestamp - 1).astralFire < ASTRAL_UMBRAL_MAX_STACKS) {
			return
		}

		// If Despair was used before Manafont, they pass the rule of using Manafont at 0 MP remaining
		const despairIndex = window.data.findIndex(event => event.action.id === this.despairId && event.timestamp < manafontTimestamp)
		if (despairIndex >= 0) {
			return true
		}

		const lastFlareIndex = window.data.findLastIndex(event => event.action.id === this.flareId && event.timestamp < manafontTimestamp)

		if (lastFlareIndex >= 0) {
			const priorGaugeState = this.gauge.getGaugeState(window.data[lastFlareIndex].timestamp - 1)
			// If player had no Umbral Hearts, Flare eats all remaining MP the way Despair does. Passes the rule of using all MP before popping Manafont
			if (priorGaugeState.umbralHearts === 0) {
				return true
			}
		}

		// If we know the player had not enough MP remaining, even without using Despair or Flare, treat this as passing the rule
		if (this.actors.current.at(manafontTimestamp - 1).mp.current < this.requiredMP) {
			return true
		}

		// Since we know they could have Despaired before Manafont, updated the metadata to indicate that
		windowMetadata.expectedDespairs++
		assignErrorCode(windowMetadata, ROTATION_ERRORS.MANAFONT_BEFORE_DESPAIR)
		return false
	}

	// Suggestion to not use Manafont before Despair
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const manafontsBeforeDespair = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.manafontAction.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
				Using <DataLink action="MANAFONT"/> before <DataLink action="DESPAIR"/> leads to fewer <DataLink showIcon={false} action="DESPAIR"/>s than possible being cast. Try to avoid that since <DataLink showIcon={false} action="DESPAIR"/> is stronger than <DataLink action="FIRE_IV"/>.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: manafontsBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<DataLink showIcon={false} action="MANAFONT"/> was used before <DataLink action="DESPAIR"/> <Plural value={manafontsBeforeDespair} one="# time" other="# times"/>.
			</Trans>,
		})
	}
}
