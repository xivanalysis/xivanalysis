import {observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import {StoreContext} from 'store'
import CombatantList from './CombatantList'
import FightList from './FightList'
import {ReportLoader} from 'components/ui/SharedLoaders'

@observer
class Find extends React.Component {
	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string,
			}).isRequired,
		}).isRequired,
	}

	static contextType = StoreContext

	componentDidMount() {
		const {reportStore} = this.context
		const {match} = this.props
		reportStore.fetchReportIfNeeded(match.params.code)
	}

	render() {
		const {reportStore} = this.context
		const {
			match: {params},
		} = this.props

		const report = reportStore.report

		// If report is null, we're probably waiting for an api call to complete
		if (!report || report.code !== params.code || report.loading) {
			return <ReportLoader/>
		}

		return params.fight
			? <CombatantList report={report} currentFight={parseInt(params.fight, 10)}/>
			: <FightList/>
	}
}

export default Find
