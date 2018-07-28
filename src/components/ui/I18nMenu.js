import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Dropdown} from 'semantic-ui-react'

import {setLanguage} from 'store/actions'

import {LANGUAGE_ARRAY} from 'data/LANGUAGES'

const {NODE_ENV} = process.env

export class I18nMenu extends Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		language: PropTypes.string.isRequired,
	}

	constructor(props) {
		super(props)

		this.handleChange = this.handleChange.bind(this)

		this.state = {
			currentLanguage: props.language,
			languages: this.filterLanguages(),
		}
	}

	filterLanguages() {
		const currentLanguage = this.props.language
		let languages = LANGUAGE_ARRAY
		if (NODE_ENV === 'production') {
			languages = languages.filter(lang => lang.enable || currentLanguage === lang.value)
		}

		return languages.map(lang => lang.menu)
	}

	componentDidUpdate() {
		if ( this.props.language !== this.state.currentLanguage ) {
			this.setState({
				currentLanguage: this.props.language,
				languages: this.filterLanguages(),
			})
		}
	}

	handleChange(event, data) {
		this.props.dispatch(setLanguage(data.value))
	}

	render() {
		if ( this.state.languages.length < 2 ) {
			return null
		}

		return <Dropdown
			className="link item"
			value={this.state.currentLanguage}
			options={this.state.languages}
			onChange={this.handleChange}
		/>
	}
}

export default connect(state => ({
	language: state.language,
}))(I18nMenu)
