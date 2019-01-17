import {Trans} from '@lingui/react'
import {observer, inject} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Loader} from 'semantic-ui-react'

import FightList from './FightList'
import CombatantList from './CombatantList'
import {ReportStore} from 'storenew/report'

import styles from './Find.module.css'

@inject('reportStore')
@observer
class Find extends Component {
	static propTypes = {
		reportStore: PropTypes.instanceOf(ReportStore).isRequired,
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string,
			}).isRequired,
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
			title: PropTypes.string,
		}),
	}

	componentDidMount() {
		const {reportStore, match} = this.props
		reportStore.fetchReportIfNeeded(match.params.code)
	}

	render() {
		const {
			reportStore,
			match: {params},
		} = this.props

		const report = reportStore.report

		// If report is null, we're probably waiting for an api call to complete
		if (!report || report.code !== params.code || report.loading) {
			return (
				<Loader active>
					<Trans id="core.find.load-report">
						Loading report
					</Trans>
				</Loader>
			)
		}

		const content = params.fight
			? <CombatantList report={report} currentFight={parseInt(params.fight, 10)}/>
			: <FightList/>
		return <div className={styles.find}>{content}</div>
	}
}

export default Find
