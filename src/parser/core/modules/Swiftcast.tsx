import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Events} from 'event'
import _ from 'lodash'
import {SEVERITY, SeverityTiers, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import {dependency} from '../Injectable'
import {BuffWindow, EvaluatedAction, EvaluationOutput, WindowEvaluator} from './ActionWindow'
import {HistoryEntry} from './ActionWindow/History'
import {GlobalCooldown} from './GlobalCooldown'

// Global default
const MISSED_SWIFTCAST_SEVERITIES: SeverityTiers = {
	1: SEVERITY.MAJOR,
}

export interface SwiftcastValidResult {
	// True if the Swiftcast use was good, false otherwise
	isValid: boolean
	// Optionally, you may provide an explanation of why the use was good/bad
	note?: JSX.Element
}

export type SwiftcastValidator =
	(window: HistoryEntry<EvaluatedAction[]>) => SwiftcastValidResult

interface SwiftcastEvaluatorOptions {
	validators: SwiftcastValidator[]
	suggestionIcon: string
	suggestionContent: JSX.Element
	severityTiers: SeverityTiers
}

class SwiftcastEvaluator implements WindowEvaluator, SwiftcastEvaluatorOptions {
	validators: SwiftcastValidator[]
	suggestionIcon: string
	suggestionContent: JSX.Element
	severityTiers: SeverityTiers

	constructor(opt: SwiftcastEvaluatorOptions) {
		this.validators = opt.validators
		this.suggestionIcon = opt.suggestionIcon
		this.suggestionContent = opt.suggestionContent
		this.severityTiers = opt.severityTiers
	}

	private isValidSwiftcastUse = _.memoize((window: HistoryEntry<EvaluatedAction[]>) => {
		return this.validators.every(validator => validator(window).isValid)
	})

	private hasNote = _.memoize((window: HistoryEntry<EvaluatedAction[]>) => {
		return this.validators.some(validator => validator(window).note != null)
	})

	private generateValidColumn = (window: HistoryEntry<EvaluatedAction[]>) => {
		const isValid = this.isValidSwiftcastUse(window)

		return <Icon
			name={isValid ? 'checkmark' : 'remove'}
			className={isValid ? 'text-success' : 'text-error'}
		/>
	}

	private generateNotesColumn = (window: HistoryEntry<EvaluatedAction[]>) => (
		<div>
			{this.validators.map(validator => validator(window).note)}
		</div>
	)

	public suggest = (windows: Array<HistoryEntry<EvaluatedAction[]>>) => {
		const badUses = windows
			.filter(window => !this.isValidSwiftcastUse(window))
			.length

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: badUses,
			why: <Trans id="core.swiftcast.suggestion.why">
				<Plural value={badUses} one="# incorrect use of" other="# incorrect uses of" /> <ActionLink action="SWIFTCAST" showIcon={false} />.
			</Trans>,
		})
	}

	public output = (windows: Array<HistoryEntry<EvaluatedAction[]>>) => {
		const columns: EvaluationOutput[] = [{
			format: 'notes',
			header: {
				header: <Trans id="core.swiftcast.chart.good.header">Good Use?</Trans>,
				accessor: 'good',
			},
			rows: windows.map(this.generateValidColumn),
		}]

		if (windows.some(this.hasNote)) {
			columns.push({
				format: 'notes',
				header: {
					header: <Trans id="core.swiftcast.chart.note.header">Note</Trans>,
					accessor: 'why',
				},
				rows: windows.map(this.generateNotesColumn),
			})
		}

		return columns
	}
}

export abstract class Swiftcast extends BuffWindow {
	static override handle: string = 'swiftcast'
	static override title = t('core.swiftcast.title')`Swiftcast Actions`

	@dependency private globalCooldown!: GlobalCooldown

	override buffStatus: Status = this.data.statuses.SWIFTCAST

	override initialise() {
		super.initialise()

		this.addEvaluator(new SwiftcastEvaluator({
			validators: [this.unusedSwiftcastValidator, ...this.swiftcastValidators],
			suggestionIcon: this.data.actions.SWIFTCAST.icon,
			suggestionContent: this.suggestionContent,
			severityTiers: this.severityTiers,
		}))
	}

	/**
	 * Implementing modules MAY want to override this to change the column header, but at this point
	 * it's probably universal to call it a 'Spell'
	 */
	protected override rotationTableHeader: JSX.Element = <Trans id="core.swiftcast.table.title">Spell</Trans>
	/**
	 * Implementing modules MAY want to override the suggestionContent to provide job-specific guidance.
	 */
	protected suggestionContent: JSX.Element = <Trans id="core.swiftcast.missed.suggestion.content">Use spells with <ActionLink action="SWIFTCAST"/> before it expires. This allows you to use spells with cast times instantly for movement or weaving.</Trans>
	/**
	 * Implementing modules MAY want to override the severityTiers to provide job-specific severities.
	 * By default, 1 miss is a major severity
	 */
	protected severityTiers: SeverityTiers = MISSED_SWIFTCAST_SEVERITIES

	/**
	 * Implementing modules MAY override this if they have special cases not covered
	 * by the standard 'considerAction' method – for example, SMN with instant ruins during
	 * DWT.
	 * @param action - the action to consider
	 * @returns true to allow the spell; false to ignore the spell
	 */
	protected considerSwiftAction(_action: Action): boolean {
		return true
	}

	/**
	 * Implementing modules MAY want to provide additional SwiftcastValidators if there are job-specific
	 * cases where a Swiftcast use may be "wrong" - e.g., RDM does not want to use Swiftcast on damaging
	 * spells with short cast times.
	 */
	protected swiftcastValidators: SwiftcastValidator[] = []

	// Provide our own validator for checking if Swiftcast fell off
	private unusedSwiftcastValidator: SwiftcastValidator = (window: HistoryEntry<EvaluatedAction[]>) => {
		const swiftConsumed = window.data.length > 0

		if (swiftConsumed) {
			return {isValid: true}
		}

		// If it's the end of the fight, only ding if it was possible to consume the Swiftcast
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		const gcdEstimate = this.globalCooldown.getDuration()

		if (fightTimeRemaining <= gcdEstimate) {
			return {
				isValid: true,
				note: <Trans id="core.swiftcast.table.note.unused-eof">Unused (end of fight)</Trans>,
			}
		}
		return {
			isValid: false,
			note: <Trans id="core.swiftcast.table.note.unused">Unused</Trans>,
		}

	}

	override onWindowAction(event: Events['action']) {
		this.debug('Evaluating action during window:', event.action)
		// ignore actions that don't have a castTime
		const action = this.data.getAction(event.action)
		if (
			action == null
			|| (action.castTime ?? 0) === 0
			|| !this.considerSwiftAction(action)
		) {
			return
		}
		super.onWindowAction(event)
	}
}
