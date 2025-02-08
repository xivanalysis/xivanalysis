import {Trans} from '@lingui/react'
import {Language, LANGUAGES} from 'data/LANGUAGES'
import {computed} from 'mobx'
import {observer} from 'mobx-react'
import {Component, ContextType, MouseEvent} from 'react'
import {Dropdown, DropdownItemProps, Icon, Image} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {gameLanguageEditions} from 'store/i18n'
import crowdinLogo from './crowdin-dark-symbol.png'
import styles from './I18nMenu.module.css'

const DEBUG = process.env.NODE_ENV === 'development'

@observer
export class I18nMenu extends Component {
	static override contextType = StoreContext
	declare context: ContextType<typeof StoreContext>

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
			.filter(([, data]) => gameLanguageEditions.includes(data.gameEdition))
			.map(([lang, data]) => ({
				...data.menu,
				value: lang,
			}))
	}

	handleChangeSite = (event: MouseEvent, data:DropdownItemProps) => {
		const {i18nStore} = this.context
		i18nStore.setSiteLanguage(data.value as Language)
	}

	handleChangeGame = (event: MouseEvent, data:DropdownItemProps) => {
		const {i18nStore} = this.context
		i18nStore.setGameLanguage(data.value as Language)
	}

	toggleOverlay = () => {
		const {i18nStore} = this.context
		i18nStore.toggleOverlay()
	}

	override render() {
		const {i18nStore} = this.context
		const gameLanguageKey = i18nStore.safeGameLanguage
		const siteLang = LANGUAGES[i18nStore.siteLanguage]
		const gameLang = LANGUAGES[gameLanguageKey]

		return <div className={styles.container}>
			{/* Site language */}
			<Dropdown
				className={styles.dropdown}
				trigger={<>
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
				trigger={<>
					<Icon name="gamepad"/>
					{gameLang ? gameLang.menu.text : 'Language'}
				</>}
			>
				<Dropdown.Menu>
					{this.gameLanguageOptions.map(options => (
						<Dropdown.Item
							key={options.value}
							active={gameLanguageKey === options.value}
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
