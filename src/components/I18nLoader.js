import {I18nProvider} from '@lingui/react'
import {observable, runInAction, reaction} from 'mobx'
import {observer, inject, disposeOnUnmount} from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import {Container, Loader} from 'semantic-ui-react'

import {I18nStore} from 'store/i18n'
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

@inject('i18nStore')
@observer
class I18nLoader extends React.Component {
	static propTypes = {
		i18nStore: PropTypes.instanceOf(I18nStore),
		children: PropTypes.node.isRequired,
	}

	@observable oldLanguage = null
	@observable catalogs = {}

	async loadCatalog(language) {
		const promises = [import(
			/* webpackMode: 'lazy' */
			/* webpackChunkName: 'i18n-[index]' */
			`../../locale/${language}/messages.json`
		)]

		// Polyfill
		const needsPolyfill = !window.Intl
		if (needsPolyfill) {
			promises.push(
				import(
					/* webpackMode: 'lazy' */
					/* webpackChunkName: 'nv-intl-polyfill' */
					'intl'
				)
			)
		}

		// Wait for the initial i18n promises before we continue. Our catalog will always be the first arg.
		const catalog = (await Promise.all(promises))[0]

		// This _must_ be run after `intl` is included and ready.
		if (needsPolyfill) {
			// TODO: This is also including `kde` and I've got no idea how to get rid of it
			await import(
				/* webpackMode: 'lazy' */
				/* webpackChunkName: 'nv-intl-polyfill-[index]' */
				/* webpackInclude: /(?:de|en|fr|ja|ko|zh).js/ */
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

		runInAction(() => {
			this.catalogs = {
				...this.catalogs,
				[language]: catalog,
			}
		})
	}

	componentDidMount() {
		this.loadCatalog(this.props.i18nStore.siteLanguage)

		disposeOnUnmount(this, reaction(
			() => this.props.i18nStore.siteLanguage,
			language => {
				if (
					language === this.oldLanguage ||
					this.catalogs[language]
				) {
					return
				}

				this.loadCatalog(language)
			},
		))
	}

	render() {
		const {i18nStore} = this.props

		let language = i18nStore.siteLanguage
		let loading = false

		if (!this.catalogs[language]) {
			if (!this.catalogs[this.oldLanguage]) {
				loading = true
			} else {
				language = this.oldLanguage
			}
		}

		if (loading) {
			return <Container>
				<Loader active>
					Loading
				</Loader>
			</Container>
		}

		return <I18nProvider language={language} catalogs={this.catalogs}>
			{DEBUG && <I18nOverlay enabled={i18nStore.overlay} language={language} />}
			{this.props.children}
		</I18nProvider>
	}
}

export default I18nLoader
