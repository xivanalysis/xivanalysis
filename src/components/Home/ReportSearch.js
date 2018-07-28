import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {withRouter} from 'react-router-dom'
import {Button, Input} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

import styles from './ReportSearch.module.css'

class ReportSearch extends Component {
	static propTypes = {
		history: PropTypes.shape({
			push: PropTypes.func.isRequired,
		}).isRequired,
	}

	static getCode(input) {
		const match = input.match(/^(?:.*reports\/)?([a-zA-Z0-9]{16})\/?(?:#.*)?$/)
		return match && match[1]
	}

	static getFight(input) {
		const match = input.match(/fight=([^&]*)/)
		return match && match[1]
	}

	static getPlayer(input) {
		const match = input.match(/source=([^&]*)/)
		return match && match[1]
	}

	constructor(props) {
		super(props)
		this.inputField = React.createRef()
	}

	// Using arrow function to maintain bind
	parseReportUrl = () => {
		const input = this.inputField.current.inputRef.value.trim()

		const code = this.constructor.getCode(input)

		// If we don't at least get a report code, just stop now
		if (!code) {
			console.log('TODO: Handle invalid url')
			return
		}

		const fight = this.constructor.getFight(input)
		const player = this.constructor.getPlayer(input)

		let url = '/'
		if (code) {
			url += `${code}/`

			if (fight) {
				url += `${fight}/`

				if (player) {
					url += `${player}/`
				}
			}

			url = ((fight && player)? 'analyse' : 'find') + url
		}

		this.props.history.push(url)
	}

	render() {
		return <Fragment>
			<span className={styles.text}><strong>
				<Trans id="core.home.paste-url">
					Paste your log URL to get started
				</Trans>
			</strong></span>
			<Input
				type="text"
				placeholder="https://www.fflogs.com/reports/..."
				ref={this.inputField}
				action={<Button onClick={this.parseReportUrl}><Trans id="core.home.analyse">Analyse</Trans></Button>}
				onChange={this.parseReportUrl}
				className={styles.input}
				inverted
			/>
		</Fragment>
	}
}

export default withRouter(ReportSearch)
