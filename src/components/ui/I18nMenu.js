import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Dropdown} from 'semantic-ui-react'

import {setLanguage} from 'store/actions'

import {LANGUAGE_ARRAY} from 'data/LANGUAGES'

export class I18nMenu extends Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		language: PropTypes.string.isRequired,
	}

	constructor(props) {
		super(props)

		this.handleChange = this.handleChange.bind(this)
	}

	handleChange(event, data) {
		this.props.dispatch(setLanguage(data.value))
	}

	render() {
		return <Dropdown
			className="link item"
			value={this.props.language}
			options={LANGUAGE_ARRAY}
			onChange={this.handleChange}
		/>
	}
}

export default connect(state => ({
	language: state.language,
}))(I18nMenu)
