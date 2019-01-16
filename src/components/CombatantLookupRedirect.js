import {Trans} from '@lingui/react'
import PropTypes from 'prop-types'
import React from 'react'
import {connect} from 'react-redux'
import {Redirect} from 'react-router'
import {Container, Loader} from 'semantic-ui-react'

import {fetchReportIfNeeded} from 'store/actions'

class CombatantLookupRedirect extends React.Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string.isRequired,
				job: PropTypes.string.isRequired,
				name: PropTypes.string.isRequired,
			}).isRequired,
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
			friendlies: PropTypes.arrayOf(PropTypes.shape({
				name: PropTypes.string.isRequired,
				type: PropTypes.string.isRequired,
				id: PropTypes.number.isRequired,
				fights: PropTypes.arrayOf(PropTypes.shape({
					id: PropTypes.number.isRequired,
				})),
			})),
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

		// Find the ID of the player matching the params
		// There _is_ a chance of dupes here (in which case it'll pick the first) - however the chance is miniscule.
		const fightId = parseInt(params.fight, 10)
		const combatant = report.friendlies.find(friendly =>
			friendly.name === params.name &&
			friendly.type === params.job &&
			friendly.fights.some(fight => fight.id === fightId)
		)

		// If we didn't find the combatant, take them to the report page as a fallback
		if (!combatant) {
			return <Redirect to={'/' + [
				'find',
				params.code,
				params.fight,
			].join('/')}/>
		}

		// We've got the combatant, redirect to the analyse page
		return <Redirect to={'/' + [
			'analyse',
			params.code,
			params.fight,
			combatant.id,
		].join('/')}/>
	}
}

export default connect(state => ({
	report: state.report,
}))(CombatantLookupRedirect)
