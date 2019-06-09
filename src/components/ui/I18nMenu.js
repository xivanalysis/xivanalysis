import {Trans} from '@lingui/react'
import {LANGUAGES} from 'data/LANGUAGES'
import {GameEdition} from 'data/PATCHES'
import {computed} from 'mobx'
import {observer} from 'mobx-react'
import React, {Component} from 'react'
import {Dropdown, Icon, Image} from 'semantic-ui-react'
import {StoreContext} from 'store'
import crowdinLogo from './crowdin-dark-symbol.png'
import styles from './I18nMenu.module.css'

const DEBUG = process.env.NODE_ENV === 'development'

@observer
class I18nMenu extends Component {
	static contextType = StoreContext

	@computed
	get availableLanguages() {
		const {i18nStore} = this.context
		const currentLanguage = i18nStore.siteLanguage
		return Object.entries(LANGUAGES)
			.filter(([lang, data]) => DEBUG || data.enable || currentLanguage === lang)
			.map(([lang, data]) => ({
				...data.menu,
				value: lang,
				description: ((process.env.LOCALE_COMPLETION || {})[lang] || '0') + '%',
			}))
	}

	@computed
	get gameLanguageOptions() {
		return Object.entries(LANGUAGES)
			.filter(([, data]) => data.gameEdition === GameEdition.GLOBAL)
			.map(([lang, data]) => ({
				...data.menu,
				value: lang,
			}))
	}

	handleChangeSite = (event, data) => {
		const {i18nStore} = this.context
		i18nStore.setSiteLanguage(data.value)
	}

	handleChangeGame = (event, data) => {
		const {i18nStore} = this.context
		i18nStore.setGameLanguage(data.value)
	}

	toggleOverlay = () => {
		const {i18nStore} = this.context
		i18nStore.toggleOverlay()
	}

	render() {
		const {i18nStore} = this.context
		const siteLang = LANGUAGES[i18nStore.siteLanguage]
		const gameLang = LANGUAGES[i18nStore.gameLanguage]

		return <div className={styles.container}>
			{/* Site language */}
			<Dropdown
				className={styles.dropdown}
				text={<>
					<Icon name="globe"/>
					{siteLang ? siteLang.menu.text : 'Language'}
				</>}
			>
				<Dropdown.Menu>
					{this.availableLanguages.map(option => <Dropdown.Item
						key={option.value}
						active={i18nStore.siteLanguage === option.value}
						onClick={this.handleChangeSite}
						{...option}
						className={styles.menuItem}
					/>)}
					<Dropdown.Divider />
					<Dropdown.Item
						onClick={this.toggleOverlay}
						icon={i18nStore.overlay? 'eye slash' : 'eye'}
						text={i18nStore.overlay
							? <Trans id="core.i18n.hide-overlay">Hide i18n overlay</Trans>
							: <Trans id="core.i18n.show-overlay">Show i18n overlay</Trans>
						}
					/>
					<Dropdown.Item
						as="a"
						href="https://crowdin.com/project/xivanalysis"
						target="_blank"
					>
						<Image src={crowdinLogo} className={styles.crowdinLogo}/>
						<Trans id="core.i18n.help-translate">
								Help translate!
						</Trans>
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>

			{/* Game Language */}
			<Dropdown
				className={styles.dropdown}
				direction="left"
				text={<>
					<Icon name="gamepad"/>
					{gameLang ? gameLang.menu.text : 'Language'}
				</>}
			>
				<Dropdown.Menu>
					{this.gameLanguageOptions.map(options => (
						<Dropdown.Item
							key={options.value}
							active={i18nStore.gameLanguage === options.value}
							onClick={this.handleChangeGame}
							{...options}
							className={styles.menuItem}
						/>
					))}
				</Dropdown.Menu>
			</Dropdown>
		</div>
	}
}

export default I18nMenu
