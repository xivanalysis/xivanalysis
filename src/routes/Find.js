import React, { Component } from 'react'
import PropTypes from 'prop-types'

class Find extends Component {
	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string
			}).isRequired
		}).isRequired
	}

	render() {
		console.log(this)
		return (
			<span>Hi</span>
		)
	}
}

export default Find
