import {i18n, Messages} from '@lingui/core'
import {I18nProvider, TransRenderProps} from '@lingui/react'
import classNames from 'classnames'
import {Language} from 'data/LANGUAGES'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Component, ContextType, ReactNode, useContext} from 'react'
import {Container, Loader, Message, Popup, List} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './I18nLoader.module.css'

export type I18nLoaderProps = {
	children: ReactNode
}

@observer
export class I18nLoader extends Component<I18nLoaderProps> {
	static override contextType = StoreContext
	declare context: ContextType<typeof StoreContext>

	loaded = observable.set<Language>()
	@observable accessor errored = false

	async loadCatalog(language: Language) {
		let catalog: {messages: Messages}
		try {
			catalog = await import(
				/* webpackMode: 'lazy' */
				/* webpackChunkName: 'i18n-[index]' */
				'../../locale/' + language + '/messages.json'
			)
		} catch {
			// There was an error while loading i18n data - we're a top-level provider, so global errors are out the window.
			runInAction(() => this.errored = true)
			return
		}

		i18n.load(language, catalog.messages)

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
			return (
				<Container>
					<Loader active>
					Loading
					</Loader>
				</Container>
			)
		}

		return (
			<I18nProvider i18n={i18n} defaultComponent={Wrapper}>
				{this.props.children}
			</I18nProvider>
		)
	}
}

const Wrapper = observer(function Wrapper({id, message, translation}: TransRenderProps) {
	const {i18nStore} = useContext(StoreContext)

	if (!i18nStore.overlay) {
		return <>{translation}</>
	}

	const translationMissing = i18nStore.siteLanguage !== 'en' && translation === message

	return (
		<Popup
			inverted
			trigger={(
				<span className={classNames({
					[styles.translationWrapper]: true,
					[styles.translationMissing]: translationMissing,
				})}>
					{translation}
				</span>
			)}
		>
			<Popup.Header>Localized String</Popup.Header>
			<Popup.Content>
				<List>
					<List.Item>
						<strong>id:</strong> {id}
					</List.Item>
					<List.Item>
						<strong>source:</strong> {message}
					</List.Item>
				</List>
			</Popup.Content>
		</Popup>
	)
})
