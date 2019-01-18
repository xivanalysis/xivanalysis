import {Trans} from '@lingui/react'
import {computed} from 'mobx'
import {inject, observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Dropdown, Icon, Image} from 'semantic-ui-react'

import LANGUAGES, {LANGUAGE_ARRAY} from 'data/LANGUAGES'
import {I18nStore} from 'storenew/i18n'

import crowdinLogo from './crowdin-dark-symbol.png'
import styles from './I18nMenu.module.css'

const DEBUG = process.env.NODE_ENV === 'development'

@inject('i18nStore')
@observer
class I18nMenu extends Component {
	static propTypes = {
		i18nStore: PropTypes.instanceOf(I18nStore),
	}

	@computed
	get availableLanguages() {
		let languages = LANGUAGE_ARRAY
		if (!DEBUG) {
			const currentLanguage = this.props.i18nStore.language
			languages = languages
				.filter(lang => lang.enable || currentLanguage === lang.value)
		}
		return languages.map(lang => lang.menu)
	}

	handleChange = (event, data) => {
		const {i18nStore} = this.props
		i18nStore.setLanguage(data.value)
	}

	toggleOverlay = () => {
		const {i18nStore} = this.props
		i18nStore.toggleOverlay()
	}

	render() {
		const {i18nStore} = this.props
		const lang = LANGUAGES[i18nStore.language]

		if (this.availableLanguages.length < 2) {
			return null
		}

		return <Dropdown
			className="link item"
			text={<>
				<Icon name="globe"/>
				{lang ? lang.menu.text : 'Language'}
			</>}
		>
			<Dropdown.Menu>
				{this.availableLanguages.map(option => <Dropdown.Item
					key={option.value}
					active={i18nStore.language === option.value}
					onClick={this.handleChange}
					{...option}
					className={styles.menuItem}
				/>)}
				<Dropdown.Divider />
				{DEBUG?
					<Dropdown.Item
						onClick={this.toggleOverlay}
						icon={i18nStore.overlay? 'eye slash' : 'eye'}
						text={i18nStore.overlay? 'Hide Overlay' : 'Show Overlay'}
					/> :
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
				}
			</Dropdown.Menu>
		</Dropdown>
	}
}

export default I18nMenu
