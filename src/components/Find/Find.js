import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Container, Loader} from 'semantic-ui-react'

import FightList from './FightList'
import CombatantList from './CombatantList'
import {fetchReportIfNeeded} from 'store/actions'

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
		const {report, match} = this.props

		// If report is null, we're probably waiting for an api call to complete
		if (!report || report.loading) {
			return <Container>
				<Loader active>Loading report</Loader>
			</Container>
		}

		return (
			<Container>
				<h1>{report.title}</h1>
				{match.params.fight?
					<CombatantList report={report} currentFight={parseInt(match.params.fight, 10)}/> :
					<FightList report={report}/>
				}
			</Container>
		)
	}
}

const mapStateToProps = state => ({
	report: state.report,
})

export default connect(mapStateToProps)(Find)
