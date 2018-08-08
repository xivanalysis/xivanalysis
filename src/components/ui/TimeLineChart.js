import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Line} from 'react-chartjs-2'

export default class TimeLineChart extends PureComponent {
	static propTypes = {
		data: PropTypes.object.isRequired,
	}

	render() {
		const options = {
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

		return <Line data={this.props.data} options={options}/>
	}
}
