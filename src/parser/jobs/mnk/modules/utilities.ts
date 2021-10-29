import {ActionKey} from 'data/ACTIONS'
import {StatusKey} from 'data/STATUSES'
import {Data} from 'parser/core/modules/Data'

export function fillActions(list: ActionKey[], data: Data): number[] {
	return list.map(actionKey => data.actions[actionKey].id)
}

export function fillStatuses(list: StatusKey[], data: Data): number[] {
	return list.map(statusKey => data.statuses[statusKey].id)
}
