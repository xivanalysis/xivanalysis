import _ from 'lodash'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Line} from 'react-chartjs-2'

const DEFAULT_OPTIONS = {
	scales: {
		xAxes: [{
			type: 'time',
			time: {
				displayFormats: {
					minute: 'm:ss',
					second: 'm:ss',
					millisecond: 'm:ss.SS',
				},
			},
		}],
	},
}

export default class TimeLineChart extends PureComponent {
	static propTypes = {
		data: PropTypes.object.isRequired,
		options: PropTypes.object,
	}

	render() {
		const options = _.merge({}, DEFAULT_OPTIONS, this.props.options || {})
		return <Line data={this.props.data} options={options}/>
	}
}
