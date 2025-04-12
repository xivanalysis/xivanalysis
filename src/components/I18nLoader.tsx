import {Catalog} from '@lingui/core'
import {Messages} from '@lingui/core/i18n'
import {I18nProvider} from '@lingui/react'
import {Language} from 'data/LANGUAGES'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Component, ContextType, ReactNode} from 'react'
import {Container, Loader, Message} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {I18nOverlay} from './I18nOverlay'

const cleanMessages = (messages: Messages) => {
	for (const [key, val] of Object.entries(messages)) {
		if (key === val) {
			delete messages[key]
		}
	}

	return messages
}

export type I18nLoaderProps = {
	children: ReactNode
}

@observer
export class I18nLoader extends Component<I18nLoaderProps> {
	static override contextType = StoreContext
	declare context: ContextType<typeof StoreContext>

	@observable accessor oldLanguage: Language | null = null
	@observable accessor catalogs: Partial<Record<Language, Catalog>> = {}
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
		const catalog: Catalog = resolutions[0]

		// This _must_ be run after `intl` is included and ready.
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
		if (catalog && catalog.messages) {
			cleanMessages(catalog.messages)
		}

		runInAction(() => {
			this.catalogs = {
				...this.catalogs,
				[language]: catalog,
			}
		})
	}

	override componentDidMount() {
		const {i18nStore} = this.context
		this.loadCatalog(i18nStore.siteLanguage)

		disposeOnUnmount(this, reaction(
			() => i18nStore.siteLanguage,
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
		let loading = false

		if (this.catalogs[language] == null) {
			loading = true
		}

		if (loading) {
			return <Container>
				<Loader active>
					Loading
				</Loader>
			</Container>
		}

		return <I18nProvider language={language} catalogs={this.catalogs}>
			<I18nOverlay enabled={i18nStore.overlay} language={language} />
			{this.props.children}
		</I18nProvider>
	}
}
