import {RotationTarget} from 'components/ui/RotationTable'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import {Suggestion} from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {NotesEvaluator} from './NotesEvaluator'

export interface RulePassedEvaluatorOpts {
	header?: RotationTarget
	passesRule: (window: HistoryEntry<EvaluatedAction[]>) => boolean | undefined
	suggestion? : (_windows: Array<HistoryEntry<EvaluatedAction[]>>) => Suggestion | undefined
}

export class RulePassedEvaluator extends NotesEvaluator {
	override header: RotationTarget | undefined
	private passesRule : (window: HistoryEntry<EvaluatedAction[]>) => boolean | undefined
	override suggest : (_windows: Array<HistoryEntry<EvaluatedAction[]>>) => Suggestion | undefined

	constructor(opts: RulePassedEvaluatorOpts) {
		super()
		this.header = opts.header,
		this.passesRule = opts.passesRule
		this.suggest = opts.suggestion ?? (() => { return undefined })
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>) {
		const rulePassed = this.passesRule(window)
		if (rulePassed == null) {
			return <Icon name={'minus'} className={'text-warning'} />
		}
		return <Icon
			name={rulePassed ? 'checkmark' : 'remove'}
			className={rulePassed ? 'text-success' : 'text-error'}
		/>
	}

	public failedRuleCount(windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		return windows.filter(window => this.passesRule(window) === false).length
	}
}
