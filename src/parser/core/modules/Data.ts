import {getDataBy} from 'data'
import {
	Action,
	ActionKey,
	layers as actionLayers,
	root as actionRoot,
} from 'data/ACTIONS'
import {getAppliedData, Layer} from 'data/layer'
import {
	layers as statusLayers,
	root as statusRoot,
	Status,
	StatusKey,
} from 'data/STATUSES'
import {Cause} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'

export class Data extends Analyser {
	static override handle = 'data'

	get actions() {
		return this.getAppliedData(actionRoot, actionLayers)
	}

	get statuses() {
		return this.getAppliedData(statusRoot, statusLayers)
	}

	getAction(id: Action['id']): Action | undefined {
		return getDataBy(this.actions, 'id', id)
	}

	getStatus(id: Status['id']): Status | undefined {
		return getDataBy(this.statuses, 'id', id)
	}

	matchActionId(keys: ActionKey[]) {
		return oneOf(keys.map(key => this.actions[key].id))
	}

	matchCauseAction(keys: ActionKey[]) {
		return filter<Cause>().type('action').action(this.matchActionId(keys))
	}

	matchStatusId(keys: StatusKey[]) {
		return oneOf(keys.map(key => this.statuses[key].id))
	}

	matchCauseStatus(keys: StatusKey[]) {
		return filter<Cause>().type('status').status(this.matchStatusId(keys))
	}

	private getAppliedData<R extends object>(root: R, layers: Array<Layer<R>>): R {
		return getAppliedData({
			root,
			layers,
			state: {
				patch: this.parser.patch,
			},
		})
	}
}
