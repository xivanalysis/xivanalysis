import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {I18nProvider} from '@lingui/react'
import {Container, Loader} from 'semantic-ui-react'

import I18nOverlay from './I18nOverlay'

const DEBUG = process.env.NODE_ENV === 'development'

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
		overlay: PropTypes.bool.isRequired,
	}

	state = {
		oldLanguage: null,
		catalogs: {},
	}

	async loadCatalog(language) {
		const catalog = await import(
			/* webpackMode: 'lazy', webpackChunkName: 'i18n-[index]' */
			`../../locale/${language}/messages.json`
		)

		if (!window.Intl) {
			await import(
				/* webpackMode: 'lazy', webpackChunkName: 'intl-polyfill' */
				'intl'
			)
			// TODO: This is also including `kde` and I've got no idea how to get rid of it
			await import(
				/* webpackMode: 'lazy' */
				/* webpackChunkName: 'intl-polyfill-[index]' */
				/* webpackInclude: /(?:de|en|fr|ja).js/ */
				`intl/locale-data/jsonp/${language}.js`
			)
		}

		// In some misguided attempt to be useful, lingui compiles
		// messages so that values without translation are set to
		// their keys. We're using a forked babel transformation that
		// doesn't strip default values, so we don't want this behavior.
		if (catalog && catalog.messages) {
			cleanMessages(catalog.messages)
		}

		if (catalog.default && catalog.default.messages) {
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

		if (language !== this.props.language) {
			this.setState({
				oldLanguage: this.props.language,
			})

			if (!catalogs[language]) {
				this.loadCatalog(language)
				return false
			}
		}

		return true
	}

	render() {
		const {overlay} = this.props
		const {oldLanguage, catalogs} = this.state

		let {language} = this.props
		let loading = false

		if (! catalogs[language]) {
			if (! catalogs[oldLanguage]) {
				loading = true
			} else {
				language = oldLanguage
			}
		}

		if (loading) {
			return <Container>
				<Loader active>
					Loading
				</Loader>
			</Container>
		}

		return <I18nProvider language={language} catalogs={catalogs}>
			{DEBUG && <I18nOverlay enabled={overlay} language={language} />}
			{this.props.children}
		</I18nProvider>
	}
}

export default connect(state => ({
	language: state.language.site,
	overlay: state.i18nOverlay,
}))(I18nLoader)
