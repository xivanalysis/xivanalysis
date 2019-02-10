import {Trans} from '@lingui/react'
import {inject, observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import {Container, Loader} from 'semantic-ui-react'

import {ReportStore} from 'store/report'

@inject('reportStore')
@observer
class LastFightRedirect extends Component {
	static propTypes = {
		reportStore: PropTypes.instanceOf(ReportStore),
		match: PropTypes.shape({
			params: PropTypes.shape({
				section: PropTypes.string.isRequired,
				code: PropTypes.string.isRequired,
				combatant: PropTypes.string,
			}).isRequired,
		}).isRequired,
	}

	componentDidMount() {
		// Make sure we've got report data
		const {reportStore, match} = this.props
		reportStore.fetchReportIfNeeded(match.params.code)
	}

	render() {
		const {
			reportStore,
			match: {params},
		} = this.props

		const report = reportStore.report

		// Show a loader if we're still loading the main report
		if (!report || report.code !== params.code || report.loading) {
			return <Container>
				<Loader active>
					<Trans id="core.analyse.load-report">
						Loading report
					</Trans>
				</Loader>
			</Container>
		}

		// Get the fight ID and build the correct URL
		const fightId = report.fights[report.fights.length - 1].id
		const url = [
			params.section,
			params.code,
			fightId,
			params.combatant || '',
		].join('/')

		return <Redirect to={'/' + url}/>
	}
}

export default LastFightRedirect
