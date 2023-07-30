import {RotationTarget} from 'components/ui/RotationTable'
import React, {ReactNode} from 'react'
import {Icon} from 'semantic-ui-react'
import {Suggestion} from '../../Suggestions'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {NotesEvaluator} from './NotesEvaluator'

export interface RulePassedEvaluatorOpts {
	header?: RotationTarget
	passesRule: (window: HistoryEntry<EvaluatedAction[]>) => boolean | undefined
	suggestion? : (windows: Array<HistoryEntry<EvaluatedAction[]>>) => Suggestion | undefined
	ruleContext? : (window: HistoryEntry<EvaluatedAction[]>) => ReactNode
}

export class RulePassedEvaluator extends NotesEvaluator {
	override header: RotationTarget | undefined
	private passesRule : (window: HistoryEntry<EvaluatedAction[]>) => boolean | undefined
	override suggest : (windows: Array<HistoryEntry<EvaluatedAction[]>>) => Suggestion | undefined
	private ruleContext : (window: HistoryEntry<EvaluatedAction[]>) => ReactNode

	constructor(opts: RulePassedEvaluatorOpts) {
		super()
		this.header = opts.header,
		this.passesRule = opts.passesRule
		this.suggest = opts.suggestion ?? (() => { return undefined })
		this.ruleContext = opts.ruleContext ?? (() => { return <></> })
	}

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>) {
		const rulePassed = this.passesRule(window)
		if (rulePassed == null) {
			return <><Icon name={'minus'} className={'text-warning'} /><br/>{this.ruleContext(window)}</>
		}
		return <><Icon
			name={rulePassed ? 'checkmark' : 'remove'}
			className={rulePassed ? 'text-success' : 'text-error'}
		/><br/>{this.ruleContext(window)}</>
	}

	public failedRuleCount(windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		return windows.filter(window => this.passesRule(window) === false).length
	}
}
