import {MessageDescriptor} from '@lingui/core'
import {t, Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Events} from 'event'
import {SEVERITY, SeverityTiers, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {dependency} from '../Injectable'
import {BuffWindow, EvaluatedAction, EvaluationOutput, ExpectedGcdCountEvaluator, NotesEvaluator, WindowEvaluator} from './ActionWindow'
import {HistoryEntry} from './ActionWindow/History'
import {GlobalCooldown} from './GlobalCooldown'
import {Icon} from 'semantic-ui-react'

// Global default
const MISSED_SWIFTCAST_SEVERITIES: SeverityTiers = {
	1: SEVERITY.MAJOR,
}

type SwiftcastValidator = (window: HistoryEntry<EvaluatedAction[]>) => {
	isValid: boolean,
	noteContent: JSX.Element,
}

export interface SwiftcastEvaluatorOptions {
	validators: SwiftcastValidator[]
	suggestionIcon: string
	suggestionContent: JSX.Element
	suggestionWindowName: JSX.Element
	severityTiers: SeverityTiers
}

class SwiftcastEvaluator implements WindowEvaluator, SwiftcastEvaluatorOptions {
	validators: SwiftcastValidator[]
	suggestionIcon: string
	suggestionContent: JSX.Element
	suggestionWindowName: JSX.Element
	severityTiers: SeverityTiers

	constructor(opt: SwiftcastEvaluatorOptions) {
		this.validators = opt.validators
		this.suggestionIcon = opt.suggestionIcon
		this.suggestionContent = opt.suggestionContent
		this.suggestionWindowName = opt.suggestionWindowName
		this.severityTiers = opt.severityTiers
	}

	private isValidSwiftcastUse = (window: HistoryEntry<EvaluatedAction[]>) => {
		return this.validators.every(validator => validator(window).isValid)
	}

	private generateValidColumn = (window: HistoryEntry<EvaluatedAction[]>) => {
		const isValid = this.isValidSwiftcastUse(window)

		return <Icon
			name={isValid ? 'checkmark' : 'remove'}
			className={isValid ? 'text-success' : 'text-error'}
		/>
	}
	
	private generateNotesColumn = (window: HistoryEntry<EvaluatedAction[]>) => {
		if (this.isValidSwiftcastUse(window)) {
			return <></>
		}

		return <>
			{this.validators.map(validator => validator(window).noteContent)}
		</>
	}

	public suggest = (windows: Array<HistoryEntry<EvaluatedAction[]>>) => {
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severityTiers,
			value: 0,
			why: this.suggestionWindowName,
		})
	}

	public output = (windows: Array<HistoryEntry<EvaluatedAction[]>>) => {
		const columns: EvaluationOutput[] = [{
			format: 'notes',
			header: {
				header: <Trans id="core.swiftcast.chart.valid.header">Valid?</Trans>,
				accessor: 'valid',
			},
			rows: windows.map(this.generateValidColumn),
		}]

		if (!windows.every(this.isValidSwiftcastUse)) {
			columns.push({
				format: 'notes',
				header: {
					header: <Trans id="core.swiftcast.chart.why.header">Why?</Trans>,
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
	static override title: MessageDescriptor = t('core.swiftcast.title')`Swiftcast Actions`

	@dependency private globalCooldown!: GlobalCooldown

	override buffStatus: Status = this.data.statuses.SWIFTCAST

	override initialise() {
		super.initialise()

		this.addEvaluator(new SwiftcastEvaluator({
			validators: [],
			suggestionIcon: this.data.actions.SWIFTCAST.icon,
			suggestionContent: this.suggestionContent,
			suggestionWindowName: <ActionLink action="SWIFTCAST" showIcon={false} />,
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

	// Checks if Swiftcast fell off without being used
	private droppedSwiftcastValidator = (window: HistoryEntry<EvaluatedAction[]>) => {
		
	}

	// Provide our own logic for the end of the fight – even though the window is
	// ~4 GCDs 'wide', we can only use one action with it anyway; this change should
	// ding them only if they had enough time during the window to use a spell with
	// swiftcast
	private adjustExpectedGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		const gcdEstimate = this.globalCooldown.getDuration()
		return (fightTimeRemaining > gcdEstimate) ? 0 : -1
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
