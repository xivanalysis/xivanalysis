import {Trans} from '@lingui/react'
import {action, observable} from 'mobx'
import {observer} from 'mobx-react'
import React from 'react'
import {RouteComponentProps, withRouter} from 'react-router-dom'
import {Button, Input, InputOnChangeData} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import styles from './ReportSearch.module.css'

const INPUT_EXPRESSIONS = [
	/**
	 * FF Logs
	 * https://www.fflogs.com/reports/1234567890abcdef
	 * 1234567890abcdef
	 * 1234567890abcdef#fight=1
	 * 1234567890abcdef#source=1
	 * 1234567890abcdef#fight=1&source=1
	 */
	/^(?:.*fflogs\.com\/reports\/)?(?<code>[a-zA-Z0-9]{16})\/?(?:#(?=(?:.*fight=(?<fight>[^&]*))?)(?=(?:.*source=(?<player>[^&]*))?).*)?$/,

	/**
	 * xivanalysis
	 * /find/1234567890abcdef/
	 * /find/1234567890abcdef/1/
	 * /analyse/1234567890abcdef/1/1/
	 */
	/\/(?:analyse|find)\/(?<code>[a-zA-Z0-9]{16})(?:\/(?<fight>[^\/]+)(?:\/(?<player>[^\/]+))?)?/,

	/**
	 * xivrdps
	 * http://www.xivrdps.com/encounters/1234567890abcdef/1
	 */
	/xivrdps(?:\.herokuapp)?\.com\/encounters\/(?<code>[a-zA-Z0-9]{16})(?:\/(?<fight>[^\/]+))?/,
]

@observer
class ReportSearch extends React.Component<RouteComponentProps> {
	@observable.ref private value: string = ''

	@action.bound
	private onChange(event: React.ChangeEvent, data: InputOnChangeData) {
		this.value = data.value

		// Try to parse the URL 'cus 'aint nobody got time to click a button.
		this.parseReportUrl()
	}

	// Using arrow function to maintain bind
	private readonly parseReportUrl = () => {
		// Filter down to regexps that match the current value
		const matches = INPUT_EXPRESSIONS
			.map(regexp => regexp.exec(this.value))
			.filter(isDefined)

		// Stop now if there's no matches
		if (matches.length === 0 || !matches[0].groups) {
			return
		}

		// Only care about the first match
		const {code, fight, player} = matches[0].groups

		// If we don't at least get a report code, just stop now
		// TODO: Revisit this if/when we add more search methods (character, etc)
		if (!code) {
			return
		}

		let url = `/${code}/`
		if (fight) {
			url += `${fight}/`
			if (player) {
				url += `${player}/`
			}
		}
		url = ((fight && player)? 'analyse' : 'find') + url

		this.props.history.push(url)
	}

	render() {
		return <>
			<strong>
				<Trans id="core.home.paste-url">
					Paste your log URL to get started
				</Trans>
			</strong>
			<Input
				type="text"
				placeholder="https://www.fflogs.com/reports/..."
				action={<Button onClick={this.parseReportUrl}><Trans id="core.home.analyse">Analyse</Trans></Button>}
				onChange={this.onChange}
				className={styles.input}
				inverted
			/>
		</>
	}
}

export default withRouter(ReportSearch)
