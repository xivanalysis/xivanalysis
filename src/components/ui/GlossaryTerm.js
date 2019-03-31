import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Popup, Icon} from 'semantic-ui-react'

import styles from './GlossaryTerm.module.css'
import TERMS from 'data/GLOSSARY'

import TransMarkdown from './TransMarkdown'
import NormalisedMessage from './NormalisedMessage'

export default class GlossaryTerm extends PureComponent {
	static propTypes = {
		term: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				text: PropTypes.string.isRequired,
				description: PropTypes.string.isRequired,
			}),
		]).isRequired,
		children: PropTypes.node,
	}

	render() {
		const {children} = this.props
		let {term} = this.props
		if (TERMS[term]) {
			term = TERMS[term]
		}

		const title = <NormalisedMessage message={term.text}/>

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
					source={term.description}
					linkTarget="_blank"
				/>
			</Popup.Content>
		</Popup>
	}
}
