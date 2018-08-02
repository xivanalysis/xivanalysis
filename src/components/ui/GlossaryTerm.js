import {withI18n} from '@lingui/react'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Popup, Icon} from 'semantic-ui-react'
import ReactMarkdown from 'react-markdown'

import styles from './GlossaryTerm.module.css'
import TERMS from 'data/GLOSSARY'

class GlossaryTerm extends PureComponent {
	static propTypes = {
		term: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				i18n_id: PropTypes.string.isRequired,
				text: PropTypes.string.isRequired,
				i18n_description: PropTypes.string.isRequired,
				description: PropTypes.string.isRequired,
			}),
		]).isRequired,
		i18n: PropTypes.shape({
			_: PropTypes.func.isRequired,
		}).isRequired,
		children: PropTypes.node,
	}

	render() {
		const {i18n, children} = this.props
		let {term} = this.props
		if (TERMS[term]) {
			term = TERMS[term]
		}

		const title = i18n._(term.i18n_id, {}, {defaults: term.text})

		return <Popup
			trigger={<span className={styles.term}>{children || title}</span>}
			hoverable={term.interactive}
			wide={term.width || 'very'}
		>
			<Popup.Header>
				<Icon name="info" />
				{ title }
			</Popup.Header>
			<Popup.Content>
				<ReactMarkdown
					source={i18n._(term.i18n_description, {}, {defaults: term.description})}
					renderers={{
						link: props => React.createElement('a', {
							target: '_blank',
							href: props.href,
						}, props.children),
					}}
				/>
			</Popup.Content>
		</Popup>
	}
}

export default withI18n()(GlossaryTerm)
