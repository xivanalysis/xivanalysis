import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {action, observable} from 'mobx'
import {observer} from 'mobx-react'
import React from 'react'
import {RouteComponentProps, withRouter, Redirect} from 'react-router-dom'
import {Button, Input, InputOnChangeData} from 'semantic-ui-react'
import styles from './ReportSearch.module.css'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {SearchHandlerResult} from 'reportSources'
import _ from 'lodash'
import {parseInput} from './parseInput'

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
		this.result = parseInput(this.value)
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
