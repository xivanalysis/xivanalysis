import React from 'react'
import {Icon} from 'semantic-ui-react'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {NotesEvaluator} from './NotesEvaluator'

export abstract class RulePassedEvaluator extends NotesEvaluator {

	protected abstract passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined

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
}
