import PropTypes from 'prop-types'
import React, {Component} from 'react'

class JobIcon extends Component {
	static propTypes = {
		job: PropTypes.shape({
			icon: PropTypes.string.isRequired,
		}).isRequired,
		className: PropTypes.string,
	}

	render() {
		const {
			job: {icon},
			className = '',
		} = this.props

		return <img
			src={`https://www.garlandtools.org/db/images/${icon}.png`}
			alt={icon}
			className={className}
		/>
	}
}

export default JobIcon
