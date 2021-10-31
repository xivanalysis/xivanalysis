import {ChartDataSets} from 'chart.js'
import Parser from 'parser/core/Parser'
import {ResourceGraphs} from '../ResourceGraphs'

export interface AbstractGaugeOptions {
	/** Reference to the parser. Required if not adding the gauge to the core gauge module. */
	parser?: Parser
	resourceGraphs?: ResourceGraphs
}

export abstract class AbstractGauge {
	private _parser?: Parser
	private _resourceGraphs?: ResourceGraphs

	/** The main parser instance. */
	protected get parser() {
		if (!this._parser) {
			throw new Error('No parser found. Ensure this gauge is being passed to the core gauge module, or initialised with a reference to the parser.')
		}

		return this._parser
	}

	protected get resourceGraphs() {
		if (!this._resourceGraphs) {
			throw new Error('No resource graphs found. Ensure this gauge is being passed to the core gauge module, or initialised with a reference to the resource graphs.')
		}
		return this._resourceGraphs
	}

	constructor(opts: AbstractGaugeOptions) {
		this._parser = opts.parser
	}

	/** Set the function used to retrieve the current timestamp. */
	setParser(parser: Parser) {
		this._parser = parser
	}

	setResourceGraphs(resourceGraphs: ResourceGraphs) {
		this._resourceGraphs = resourceGraphs
	}

	/** Reset any values stored within the gauge to their initial state. */
	abstract reset(): void

	/** Generate a dataset suitable for use in ChartJS */
	generateDataset(): ChartDataSets | undefined { return undefined }

	generateResourceGraph(): void { return }
}
