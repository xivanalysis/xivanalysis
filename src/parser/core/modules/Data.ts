import {layers as actionLayers, root as actionRoot} from 'data/ACTIONS/newIndex'
import {applyLayer, Layer} from 'data/layer'
import {layers as statusLayers, root as statusRoot} from 'data/STATUSES'
import Module from 'parser/core/Module'

export class Data extends Module {
	static handle = 'data'

	private appliedCache = new Map<unknown, unknown>()

	get statuses() {
		return this.getAppliedData(statusRoot, statusLayers)
	}

	get actions() {
		return this.getAppliedData(actionRoot, actionLayers)
	}

	private getAppliedData<R>(root: R, layers: Array<Layer<R>>): R {
		const cached = this.appliedCache.get(root)
		if (cached) {
			return cached as R
		}

		this.debug('generating applied data for', root)

		const applied = layers
			.filter(layer => this.parser.patch.compare(layer.patch) >= 0)
			.reduce(applyLayer, root)
		this.appliedCache.set(root, applied)

		return applied
	}
}
