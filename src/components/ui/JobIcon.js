import React, { Component } from 'react'
import PropTypes from 'prop-types'

class JobIcons extends Component {
	static propTypes = {
		job: PropTypes.shape({
			icon: PropTypes.string.isRequired
		}).isRequired,
		set: PropTypes.number
	}

	render() {
		const {
			job: { icon },
			set = 2
		} = this.props

		return <img src={`https://secure.xivdb.com/img/classes/set${set}/${icon}.png`} alt={icon}/>
	}
}

export default JobIcons
