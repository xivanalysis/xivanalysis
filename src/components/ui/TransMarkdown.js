import {withI18n} from '@lingui/react'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import ReactMarkdown from 'react-markdown'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import GlossaryTerm from './GlossaryTerm'
import {ActionLink, StatusLink} from './DbLink'

// This line is required because eslint thinks LINK_TYPES is
// full of React components when it's not.
/* eslint react/display-name: 0 */

const LINK_EXTRACTOR = /^~([^/]+)\/(.+)$/

const LINK_TYPES = {
	term: (term, children) => React.createElement(GlossaryTerm, {
		term,
	}, children),

	action: (actionId, children) => {
		const action = ACTIONS[actionId]
		if (action) {
			actionId = action.id
		} else {
			actionId = parseInt(actionId, 10)
		}

		return React.createElement(ActionLink, {
			id: actionId,
			name: children,
		})
	},

	status: (statusId, children) => {
		const status = STATUSES[statusId]
		if (status) {
			statusId = status.id
		} else {
			statusId = parseInt(statusId, 10)
		}

		return React.createElement(StatusLink, {
			id: statusId,
			name: children,
		})
	},
}

class TransMarkdown extends PureComponent {
	static propTypes = {
		i18n: PropTypes.shape({
			_: PropTypes.func.isRequired,
		}),
		source: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				defaults: PropTypes.string,
				values: PropTypes.object,
			}),
		]).isRequired,
		renderers: PropTypes.object,
		linkTarget: PropTypes.string,
	}

	renderLink(data) {
		// Don't do this at home kids
		const href = React.isValidElement(data.href)
			? data.href.props.children
			: data.href

		const match = LINK_EXTRACTOR.exec(href)
		if (match) {
			const factory = LINK_TYPES[match[1]]
			if (factory) {
				return factory(match[2], data.isReference ? null : data.children)
			}
		}

		return React.createElement('a', {
			target: this.props.linkTarget,
			href: data.href,
		}, data.children)
	}

	render() {
		const {i18n, source, renderers} = this.props

		// i18n might not be ready yet, load the default as a fallback
		// ridiculous .replace because lingui is pants on head and escaped the escape characters.
		const finalSource = i18n
			? i18n._(source).replace(/\\`/g, '`')
			: typeof source === 'string'? source : (source.defaults || '')

		return <ReactMarkdown
			source={finalSource}
			renderers={{
				...renderers,
				link: props => this.renderLink(props),

				// This breaks reference style links in Markdown, and
				// I'm not sure why, but I'm also almost certain no one
				// is going to use them, while this is important for
				// allowing people to use links to insert rich content
				// like action links.
				linkReference: props => this.renderLink({
					...props,
					isReference: true,
					href: props.children[0],
				}),
			}}
		/>
	}
}

export default withI18n()(TransMarkdown)
