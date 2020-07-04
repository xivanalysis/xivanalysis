import type {ChartData as PureChartData, ChartOptions} from 'chart.js'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {ChartData, Line} from 'react-chartjs-2'

const DEFAULT_OPTIONS: ChartOptions = {
	aspectRatio: 3,
	scales: {
		xAxes: [{
			type: 'time',
			time: {
				displayFormats: {
					minute: 'm:ss',
					second: 'm:ss',
					millisecond: 'm:ss.SS',
				},
				// This tooltip format displays similar to a "relative" timestamp,
				// since react assumes UNIX epoch timestamps for the data.
				tooltipFormat: 'mm:ss.SSS',
			},
		}],
	},
}

interface TimeLineChartProps {
	data: ChartData<PureChartData>
	options?: ChartOptions
}

export default class TimeLineChart extends PureComponent<TimeLineChartProps> {
	static propTypes = {
		data: PropTypes.object.isRequired,
		options: PropTypes.object,
	}

	render() {
		const options = _.merge({}, DEFAULT_OPTIONS, this.props.options || {})
		return <Line
			data={this.props.data}
			options={options}
			// Using this trash 'cus aspectRatio doesn't work with the react wrapper
			width={options.aspectRatio}
			height={1}
		/>
	}
}
