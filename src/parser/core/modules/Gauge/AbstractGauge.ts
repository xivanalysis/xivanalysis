import {ChartDataSets} from 'chart.js'
import Parser from 'parser/core/Parser'

export interface AbstractGaugeOptions {
	/** Reference to the parser. Required if not adding the gauge to the core gauge module. */
	parser?: Parser
}

export abstract class AbstractGauge {
	private _parser?: Parser

	/** The main parser instance. */
	protected get parser() {
		if (!this._parser) {
			throw new Error('No parser found. Ensure this gauge is being passed to the core gauge module, or initialised with a reference to the parser.')
		}

		return this._parser
	}

	constructor(opts: AbstractGaugeOptions) {
		this._parser = opts.parser
	}

	/** Set the function used to retrieve the current timestamp. */
	setParser(parser: Parser) {
		this._parser = parser
	}

	/** Reset any values stored within the gauge to their initial state. */
	abstract reset(): void

	/** Generate a dataset suitable for use in ChartJS */
	generateDataset(): ChartDataSets | undefined { return undefined }
}
