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
import {Analyser} from 'parser/core/Analyser'
import {oneOf} from 'parser/core/filter'

export class Data extends Analyser {
	static handle = 'data'

	get actions() {
		return this.getAppliedData(actionRoot, actionLayers)
	}

	get statuses() {
		return this.getAppliedData(statusRoot, statusLayers)
	}

	getAction(id: Action['id']) {
		return getDataBy(this.actions, 'id', id)
	}

	getStatus(id: Status['id']) {
		return getDataBy(this.statuses, 'id', id)
	}

	matchActionId(keys: ActionKey[]) {
		return oneOf(keys.map(key => this.actions[key].id))
	}

	matchStatusId(keys: StatusKey[]) {
		return oneOf(keys.map(key => this.statuses[key].id))
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
