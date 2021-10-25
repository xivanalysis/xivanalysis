import {ActionRoot} from 'data/ACTIONS/root'
import {StatusRoot} from 'data/STATUSES/root'
import {Data} from 'parser/core/modules/Data'

export function FillActions(list: Array<keyof ActionRoot>, data: Data): number[] {
	return list.map(actionKey => data.actions[actionKey].id)
}

export function FillStatuses(list: Array<keyof StatusRoot>, data: Data): number[] {
	return list.map(statusKey => data.statuses[statusKey].id)
}
