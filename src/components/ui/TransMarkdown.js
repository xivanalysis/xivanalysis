import {withI18n} from '@lingui/react'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import ReactMarkdown from 'react-markdown'

class TransMarkdown extends PureComponent {
	static propTypes = {
		id: PropTypes.string.isRequired,
		i18n: PropTypes.shape({
			_: PropTypes.func.isRequired,
		}).isRequired,
		source: PropTypes.string.isRequired,
		linkTarget: PropTypes.string,
	}

	render() {
		const {id, i18n, source, linkTarget} = this.props

		return <ReactMarkdown
			source={i18n._(id, {}, {defaults: source})}
			renderers={{
				link: props => React.createElement('a', {
					target: linkTarget,
					href: props.href,
				}, props.children),
			}}
		/>
	}
}

export default withI18n()(TransMarkdown)
