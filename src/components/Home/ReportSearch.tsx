import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {action, observable} from 'mobx'
import {observer} from 'mobx-react'
import React from 'react'
import {RouteComponentProps, withRouter, Redirect} from 'react-router-dom'
import {Button, Input, InputOnChangeData} from 'semantic-ui-react'
import styles from './ReportSearch.module.css'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {reportSources, SearchHandlerResult} from 'reportSources'
import _ from 'lodash'

// Localhost is... a bit generous. But we'll let the rest of the app fail out on that for us.
const XIVA_URL_EXPRESSION = /(?:xivanalysis.com|localhost(?::\d+)?)\/(.+)/

const DEFAULT_REASON = t('core.home.report-search.unknown-query-error')`An unknown error occured when parsing the provided query.`

@observer
class ReportSearch extends React.Component<RouteComponentProps> {
	@observable.ref private value = ''
	@observable.ref private result: SearchHandlerResult = {valid: false}

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

	private parseInput(input: string): SearchHandlerResult {
		// Check if any report sources provide a matching search handler
		for (const source of reportSources) {
			if (source.searchHandlers == null) { continue }

			for (const handler of source.searchHandlers) {
				const match = handler.regexp.exec(input)
				if (match == null) { continue }

				const result = handler.handler(match.groups ?? {})

				if (!result.valid) { return result }

				return {
					valid: true,
					path: `${source.path}${result.path}`,
				}
			}
		}

		// No report source matches, check if it's a xiva link we can blindly copy
		const match = XIVA_URL_EXPRESSION.exec(input)
		if (match != null) {
			return {
				valid: true,
				path: match[1],
			}
		}

		return {
			valid: false,
			reason: t('core.home.report-search.invalid-query')`The provided query does not match any of the expected formats.`,
		}
	}

	render() {
		if (this.result.valid) {
			return <Redirect to={this.result.path}/>
		}

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
