import {withI18n} from '@lingui/react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import ReactMarkdown from 'react-markdown'

class TransMarkdown extends Component {
	static propTypes = {
		id: PropTypes.string.isRequired,
		i18n: PropTypes.shape({
			_: PropTypes.func.isRequired,
		}).isRequired,
		source: PropTypes.string.isRequired,
	}
	render() {
		const {id, i18n, source} = this.props

		return <ReactMarkdown
			source={i18n._(id, {}, {defaults: source})}
		/>
	}
}

export default withI18n()(TransMarkdown)
