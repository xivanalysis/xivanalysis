import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Dropdown} from 'semantic-ui-react'

import LANGUAGES, {LANGUAGE_ARRAY} from 'data/LANGUAGES'
import {setLanguage, toggleI18nOverlay} from 'store/actions'

import styles from './I18nMenu.module.css'

const DEBUG = process.env.NODE_ENV === 'development'

export class I18nMenu extends Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		language: PropTypes.string.isRequired,
		overlay: PropTypes.bool.isRequired,
	}

	constructor(props) {
		super(props)

		this.toggleOverlay = this.toggleOverlay.bind(this)
		this.handleChange = this.handleChange.bind(this)

		this.state = {
			currentLanguage: props.language,
			languages: this.filterLanguages(),
		}
	}

	filterLanguages() {
		const currentLanguage = this.props.language
		let languages = LANGUAGE_ARRAY
		if (! DEBUG) {
			languages = languages.filter(lang => lang.enable || currentLanguage === lang.value)
		}

		return languages.map(lang => lang.menu)
	}

	componentDidUpdate() {
		if (this.props.language !== this.state.currentLanguage) {
			this.setState({
				currentLanguage: this.props.language,
				languages: this.filterLanguages(),
			})
		}
	}

	handleChange(event, data) {
		this.props.dispatch(setLanguage(data.value))
	}

	toggleOverlay() {
		this.props.dispatch(toggleI18nOverlay())
	}

	render() {
		const {overlay} = this.props
		const {currentLanguage, languages} = this.state
		const lang = LANGUAGES[currentLanguage]

		if (languages.length < 2) {
			return null
		}

		return <Dropdown
			className="link item"
			text={lang ? lang.menu.text : 'Language'}
		>
			<Dropdown.Menu>
				{ languages.map(option => <Dropdown.Item
					key={option.value}
					active={currentLanguage === option.value}
					onClick={this.handleChange}
					{...option}
					className={styles.menuItem}
				/>) }
				{DEBUG && <>
					<Dropdown.Divider />
					<Dropdown.Item
						onClick={this.toggleOverlay}
						icon={overlay? 'eye slash' : 'eye'}
						text={overlay ? 'Hide Overlay' : 'Show Overlay'}
					/>
				</>}
			</Dropdown.Menu>
		</Dropdown>
	}
}

export default connect(state => ({
	language: state.language.site,
	overlay: state.i18nOverlay,
}))(I18nMenu)
