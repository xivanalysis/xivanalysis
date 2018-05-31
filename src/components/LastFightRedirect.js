import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { Container, Loader } from 'semantic-ui-react'

import { fetchReportIfNeeded } from 'store/actions'

class LastFightRedirect extends Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		match: PropTypes.shape({
			params: PropTypes.shape({
				section: PropTypes.string.isRequired,
				code: PropTypes.string.isRequired,
				combatant: PropTypes.string
			}).isRequired
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
			fights: PropTypes.arrayOf(PropTypes.shape({
				id: PropTypes.number.isRequired
			}))
		})
	}

	componentWillMount() {
		// Make sure we've got report data
		const { dispatch, match } = this.props
		dispatch(fetchReportIfNeeded(match.params.code))
	}

	render() {
		const {
			report,
			match: { params }
		} = this.props

		// Show a loader if we're still loading the main report
		if (!report || report.loading) {
			return <Container>
				<Loader active>Loading report</Loader>
			</Container>
		}

		// Get the fight ID and build the correct URL
		const fightId = report.fights[report.fights.length - 1].id
		const url = [
			params.section,
			params.code,
			fightId,
			params.combatant || ''
		].join('/')

		return <Redirect to={'/' + url}/>
	}
}

const mapStateToProps = state => ({
	report: state.report
})

export default connect(mapStateToProps)(LastFightRedirect)
