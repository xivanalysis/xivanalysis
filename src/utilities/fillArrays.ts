import {Action, ActionKey} from 'data/ACTIONS'
import {Status, StatusKey} from 'data/STATUSES'
import {Data} from 'parser/core/modules/Data'

export function fillActionIds(list: ActionKey[], data: Data): Array<Action['id']> {
	return list.map(actionKey => data.actions[actionKey].id)
}

export function fillActions(list: ActionKey[], data: Data): Action[] {
	return list.map(actionKey => data.actions[actionKey])
}

export function fillStatusIds(list: StatusKey[], data: Data): Array<Status['id']> {
	return list.map(statusKey => data.statuses[statusKey].id)
}

export function fillStatuses(list: StatusKey[], data: Data): Status[] {
	return list.map(statusKey => data.statuses[statusKey])
}
