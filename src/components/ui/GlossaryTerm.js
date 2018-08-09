import {withI18n} from '@lingui/react'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Popup, Icon} from 'semantic-ui-react'

import styles from './GlossaryTerm.module.css'
import TERMS from 'data/GLOSSARY'

import TransMarkdown from './TransMarkdown'

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
				<TransMarkdown
					id={term.i18n_description}
					source={term.description}
					linkTarget="_blank"
				/>
			</Popup.Content>
		</Popup>
	}
}

export default withI18n()(GlossaryTerm)
