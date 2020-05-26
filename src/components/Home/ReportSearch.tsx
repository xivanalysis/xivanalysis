import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {action, observable, reaction} from 'mobx'
import {observer, disposeOnUnmount} from 'mobx-react'
import React from 'react'
import {RouteComponentProps, withRouter} from 'react-router-dom'
import {Button, Input, InputOnChangeData} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import styles from './ReportSearch.module.css'
import NormalisedMessage from 'components/ui/NormalisedMessage'

type ReportSpecifier = {code: string, fight?: string, player?: string}

type ParseResult =
	| {valid: false, reason?: MessageDescriptor}
	| {valid: true} & ReportSpecifier

const DEFAULT_REASON = t('core.home.report-search.unknown-query-error')`An unknown error occured when parsing the provided query.`

const INPUT_EXPRESSIONS = [
	/**
	 * FF Logs
	 * https://www.fflogs.com/reports/1234567890abcdef
	 * 1234567890abcdef
	 * 1234567890abcdef#fight=1
	 * 1234567890abcdef#source=1
	 * 1234567890abcdef#fight=1&source=1
	 */
	/^(?:.*fflogs\.com\/reports\/)?(?<code>(?:a:)?[a-zA-Z0-9]{16})\/?(?:#(?=(?:.*fight=(?<fight>[^&]*))?)(?=(?:.*source=(?<player>[^&]*))?).*)?$/,

	/**
	 * xivanalysis
	 * /find/1234567890abcdef/
	 * /find/1234567890abcdef/1/
	 * /analyse/1234567890abcdef/1/1/
	 */
	/\/(?:analyse|find)\/(?<code>(?:a:)?[a-zA-Z0-9]{16})(?:\/(?<fight>[^\/]+)(?:\/(?<player>[^\/]+))?)?/,

	/**
	 * xivrdps
	 * http://www.xivrdps.com/encounters/1234567890abcdef/1
	 */
	/xivrdps(?:\.herokuapp)?\.com\/encounters\/(?<code>(?:a:)?[a-zA-Z0-9]{16})(?:\/(?<fight>[^\/]+))?/,
]

@observer
class ReportSearch extends React.Component<RouteComponentProps> {
	@observable.ref private value = ''
	@observable.ref private result: ParseResult = {valid: false}

	componentDidMount() {
		disposeOnUnmount(this, reaction(
			() => this.result,
			report => this.onResultUpdate(report),
		))
	}

	@action.bound
	private onChange(event: React.ChangeEvent, data: InputOnChangeData) {
		this.value = data.value

		// 'aint nobody got time to click a button.
		this.onSearch()
	}

	@action.bound
	private onSearch() {
		this.result = this.parseInput(this.value)
	}

	private onResultUpdate(result: ParseResult) {
		if (!result.valid) {
			return
		}

		this.goToReport(result)
	}

	private parseInput(input: string): ParseResult {
		// Filter down to regexps that match the current value
		const match = INPUT_EXPRESSIONS
			.map(regexp => regexp.exec(input))
			.find(isDefined)

		// Stop now if there's no matches
		if (match == null || !match.groups) {
			return {
				valid: false,
				reason: t('core.home.report-search.invalid-query')`The provided query does not match any of the expected formats.`,
			}
		}

		// Only care about the first match
		const {code, fight, player} = match.groups

		// If we don't at least get a report code, just stop now
		// TODO: Revisit this if/when we add more search methods (character, etc)
		if (!code) {
			return {valid: false}
		}

		return {valid: true, code, fight, player}
	}

	private goToReport({code, fight, player}: ReportSpecifier) {
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
		const hasErrors = !this.result.valid && this.value !== ''
		const reason = this.result.valid
			? undefined
			: this.result.reason

		return <>
			<strong>
				{hasErrors ? (
					<span className="text-error">
						<NormalisedMessage message={reason ?? DEFAULT_REASON}/>
					</span>
				) : (
					<Trans id="core.home.paste-url">
						Paste your log URL to get started
					</Trans>
				)}
			</strong>
			<Input
				type="text"
				placeholder="https://www.fflogs.com/reports/..."
				action={(
					<Button onClick={this.onSearch} negative={hasErrors}>
						<Trans id="core.home.analyse">Analyse</Trans>
					</Button>
				)}
				onChange={this.onChange}
				className={styles.input}
				inverted
				error={hasErrors}
			/>
		</>
	}
}

export default withRouter(ReportSearch)
