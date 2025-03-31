import {i18n, Messages} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {Language} from 'data/LANGUAGES'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Component, ContextType, ReactNode} from 'react'
import {Container, Loader, Message} from 'semantic-ui-react'
import {StoreContext} from 'store'

// const cleanMessages = (messages: Messages) => {
// 	for (const [key, val] of Object.entries(messages)) {
// 		if (key === val) {
// 			delete messages[key]
// 		}
// 	}

// 	return messages
// }

export type I18nLoaderProps = {
	children: ReactNode
}

// TODO: massivly simplify all this it's hot garbo
@observer
export class I18nLoader extends Component<I18nLoaderProps> {
	static override contextType = StoreContext
	declare context: ContextType<typeof StoreContext>

	loaded = observable.set<Language>()
	@observable accessor errored = false

	async loadCatalog(language: Language) {
		const promises = [import(
			/* webpackMode: 'lazy' */
			/* webpackChunkName: 'i18n-[index]' */
			'../../locale/' + language + '/messages.json'
		)]

		// Polyfill
		const needsPolyfill = !window.Intl
		if (needsPolyfill) {
			promises.push(
				import(
					/* webpackMode: 'lazy' */
					/* webpackChunkName: 'nv-intl-polyfill' */
					'intl'
				),
			)
		}

		// Wait for the initial i18n promises before we continue. Our catalog will always be the first arg.
		let resolutions
		try {
			resolutions = await Promise.all(promises)
		} catch {
			// There was an error while loading i18n data - we're a top-level provider, so global errors are out the window.
			runInAction(() => this.errored = true)
			return
		}
		const messages: Messages = resolutions[0].messages
		// const localeData: LocaleData = resolutions[0].languageData

		// This _must_ be run after `intl` is included and ready.
		// TODO: is this still needed?
		if (needsPolyfill) {
			// TODO: This is also including `kde` and I've got no idea how to get rid of it
			try {
				await import(
					/* webpackMode: 'lazy' */
					/* webpackChunkName: 'nv-intl-polyfill-[index]' */
					/* webpackInclude: /(?:de|en|fr|ja|ko|zh).js/ */
					'intl/locale-data/jsonp/' + language + '.js'
				)
			} catch {
				runInAction(() => this.errored = true)
				return
			}
		}

		// In some misguided attempt to be useful, lingui compiles
		// messages so that values without translation are set to
		// their keys. We're using a forked babel transformation that
		// doesn't strip default values, so we don't want this behavior.
		// if (catalog && catalog.messages) {
		// 	cleanMessages(catalog.messages)
		// }
		console.log(messages)

		i18n.load({[language]: messages})
		// TODO: make-plural?
		// i18n.loadLocaleData({[language]: localeData})

		runInAction(() => this.loaded.add(language))
	}

	override componentDidMount() {
		const {i18nStore} = this.context

		disposeOnUnmount(this, reaction(
			() => i18nStore.siteLanguage,
			async language => {
				if (!this.loaded.has(language)) {
					await this.loadCatalog(language)
				}

				i18n.activate(language)
			},
			{fireImmediately: true}
		))
	}

	override render() {
		// If we errored out, show _something_ to signify the issue.
		if (this.errored) {
			// TODO: This needs to be in every language, I guess.
			return (
				<Container>
					<Message error>
						<Message.Header>Could not load translations.</Message.Header>
						One or more errors occured while loading translation data. Please refresh to try again. If this error persists, please let us know on Discord.
					</Message>
				</Container>
			)
		}

		const {i18nStore} = this.context

		const language = i18nStore.siteLanguage
		const loading = !this.loaded.has(language)

		if (loading) {
			return <Container>
				<Loader active>
					Loading
				</Loader>
			</Container>
		}

		return <I18nProvider i18n={i18n}>
			{/* TODO: Might be able to use defaultComponent to reimplement the overlay? */}
			{/* <I18nOverlay enabled={i18nStore.overlay} language={language} /> */}
			{this.props.children}
		</I18nProvider>
	}
}
