import React, {ReactNode} from 'react'
import {Icon} from 'semantic-ui-react'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {NotesEvaluator} from './NotesEvaluator'

export abstract class RulePassedEvaluator extends NotesEvaluator {

	protected abstract passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined
	protected ruleContext(_window: HistoryEntry<EvaluatedAction[]>): ReactNode { return <></> }

	override generateNotes(window: HistoryEntry<EvaluatedAction[]>) {
		const rulePassed = this.passesRule(window)
		let ruleIcon
		if (rulePassed == null) {
			ruleIcon = <Icon name={'minus'} className={'text-warning'} />
		} else {
			ruleIcon = <Icon
				name={rulePassed ? 'checkmark' : 'remove'}
				className={rulePassed ? 'text-success' : 'text-error'}
			/>
		}
		return <>{ruleIcon}<br/>{this.ruleContext(window)}</>
	}

	public failedRuleCount(windows: Array<HistoryEntry<EvaluatedAction[]>>): number {
		return windows.filter(window => this.passesRule(window) === false).length
	}
}
