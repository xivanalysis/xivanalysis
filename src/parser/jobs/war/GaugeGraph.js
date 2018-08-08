import React, {Fragment} from 'react'
import {Line} from 'react-chartjs-2'

import Module from 'parser/core/Module'
//import ACTIONS, {getAction} from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'

export default class GaugeGraph extends Module {
	static handle = 'gaugegraph'
	static dependencies = [
		'gauge',
	]

	_graphData = []

	constructor(...args) {
		super(...args)
	}

	output() {
		const data = {
			datasets: [
				{
					fill: false,
					data: this.gauge.getTotalRage(),
				},
			],
		}

		console.log(this.gauge.getTotalRage())
		return <Fragment>
			<Line
				data={data}
			/>
		</Fragment>
	}
}
