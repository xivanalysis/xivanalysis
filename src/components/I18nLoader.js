import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {I18nProvider} from '@lingui/react'
import {Container, Loader} from 'semantic-ui-react'

const cleanMessages = messages => {
	for (const [key, val] of Object.entries(messages)) {
		if (key === val) {
			delete messages[key]
		}
	}

	return messages
}

export class I18nLoader extends Component {
	static propTypes = {
		children: PropTypes.node.isRequired,
		language: PropTypes.string.isRequired,
	}

	state = {
		catalogs: {},
	}

	async loadCatalog(language) {
		const catalog = await import(
			/* webpackMode: 'lazy', webpackChunkName: 'i18n-[index]' */
			`../../locale/${language}/messages.json`
		)

		// In some misguided attempt to be useful, lingui compiles
		// messages so that values without translation are set to
		// their keys. We're using a forked babel transformation that
		// doesn't strip default values, so we don't want this behavior.
		if (catalog && catalog.messages) {
			cleanMessages(catalog.messages)
		}

		if ( catalog.default && catalog.default.messages ) {
			cleanMessages(catalog.default.messages)
		}

		this.setState(state => ({
			catalogs: {
				...state.catalogs,
				[language]: catalog,
			},
		}))
	}

	componentDidMount() {
		this.loadCatalog(this.props.language)
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {language} = nextProps
		const {catalogs} = nextState

		if (language !== this.props.language && !catalogs[language] ) {
			this.loadCatalog(language)
			return false
		}

		return true
	}

	render() {
		const {language} = this.props
		const {catalogs} = this.state

		if ( ! catalogs[language] ) {
			return <Container>
				<Loader active>
					Loading
				</Loader>
			</Container>
		}

		return <I18nProvider language={language} catalogs={catalogs}>
			{this.props.children}
		</I18nProvider>
	}
}

export default connect(state => ({
	language: state.language,
}))(I18nLoader)
