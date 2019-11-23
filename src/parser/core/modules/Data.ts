import {applyLayer} from 'data/layer'
import collated, {layers, root} from 'data/STATUSES/newIndex'
import Module from 'parser/core/Module'

export class Data extends Module {
	static handle = 'data'
	static debug = true

	protected init() {
		const statuses = layers
			.filter(layer => this.parser.patch.compare(layer.patch) >= 0)
			.reduce(applyLayer, root)
		this.debug(statuses)
		this.debug(collated)
	}
}
