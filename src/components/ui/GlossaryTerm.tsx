import {GlossaryEntry, TermKey, TERMS} from 'data/GLOSSARY'
import {PureComponent, ReactNode} from 'react'
import {Popup, Icon} from 'semantic-ui-react'
import styles from './GlossaryTerm.module.css'
import NormalisedMessage from './NormalisedMessage'
import TransMarkdown from './TransMarkdown'

export type GlossaryTermProps = {
	term: TermKey | GlossaryEntry
	children?: ReactNode
}

export class GlossaryTerm extends PureComponent<GlossaryTermProps> {
	override render() {
		const {children} = this.props
		let {term} = this.props
		if (typeof term === 'string') {
			term = TERMS[term]
		}

		const title = <NormalisedMessage message={term.text}/>

		return <Popup
			trigger={<span className={styles.term}>{children || title}</span>}
			wide="very"
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
