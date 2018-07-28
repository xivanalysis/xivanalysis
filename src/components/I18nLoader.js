import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {I18nProvider} from '@lingui/react'

import {DEFAULT_LANGUAGE} from 'data/LANGUAGES'

export class I18nLoader extends Component {
	static propTypes = {
		children: PropTypes.node.isRequired,
		language: PropTypes.string.isRequired,
	}

	state = {
		catalogs: {},
	}

	async loadCatalog(language) {
		let catalog

		// Don't try loading anything for the default language. All those
		// strings are included in the application.
		if (language === DEFAULT_LANGUAGE) {
			catalog = {}

		} else {
			catalog = await import(
				/* webpackMode: 'lazy', webpackChunkName: 'i18n-[index]' */
				`../../locale/${language}/messages.js`
			)
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
		const {children, language} = this.props
		const {catalogs} = this.state

		if ( ! catalogs[language] ) {
			return null
		}

		return <I18nProvider language={language} catalogs={catalogs}>
			{children}
		</I18nProvider>
	}
}

export default connect(state => ({
	language: state.language,
}))(I18nLoader)
