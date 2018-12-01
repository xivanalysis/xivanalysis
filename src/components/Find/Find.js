import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Loader} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

import FightList from './FightList'
import CombatantList from './CombatantList'
import {fetchReportIfNeeded} from 'store/actions'

import styles from './Find.module.css'

class Find extends Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
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
		const {dispatch, match} = this.props
		dispatch(fetchReportIfNeeded(match.params.code))
	}

	render() {
		const {
			report,
			match: {params},
		} = this.props

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
			: <FightList report={report}/>
		return <div className={styles.find}>{content}</div>
	}
}

const mapStateToProps = state => ({
	report: state.report,
})

export default connect(mapStateToProps)(Find)
