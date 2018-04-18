import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { fetchReportIfNeeded } from '@/store/actions'
import { fflogsApi } from '@/api'

class Analyse extends Component {
	// TODO: I should really make a definitions file for this shit
	// TODO: maybe flow?
	// Also like all the functionality
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string.isRequired,
				combatant: PropTypes.string.isRequired
			}).isRequired
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired
		})
	}

	componentWillMount() {
		this.fetchData()
	}

	componentDidUpdate(prevProps/* , prevState */) {
		// TODO: do i need this? mostly url updates
		this.fetchData(prevProps)
	}

	reset() {
		console.log('TODO: reset')
	}

	fetchData(prevProps) {
		const { dispatch, match } = this.props

		// Make sure we've got a report, then run the parse
		dispatch(fetchReportIfNeeded(match.params.code))
		this.fetchEventsAndParseIfNeeded(prevProps)
	}

	fetchEventsAndParseIfNeeded(prevProps) {
		// holy shit you can do this?
		const {
			report,
			match: { params }
		} = this.props

		// TODO: actually check if needed
		const changed = !prevProps
			|| report !== prevProps.report
		if (changed) {
			// TODO: does it really need to reset here?
			this.reset()

			// If we don't have everything we need, stop before we hit the api
			// TODO: more checks
			const valid = report
				&& !report.loading
				&& params.fight
				&& params.combatant

			if (!valid) { return }

			console.log('SENDING', report.code, params.fight, params.combatant)
			this.fetchEventsAndParse()
		}
	}

	async fetchEventsAndParse() {
		// fuck it just getting it as a test
		// TODO: actually write this up properly
		const report = this.props.report
		const fightId = parseInt(this.props.match.params.fight, 10)
		const fight = report.fights.filter(fight => fight.id === fightId)[0]

		const resp = await fflogsApi.get('report/events/' + this.props.match.params.code, {
			params: {
				start: fight.start_time,
				end: fight.end_time,
				actorid: this.props.match.params.combatant,
				// filter?
				translate: true // probs keep same?
			}
		})
		console.log(resp)
	}

	render() {
		return <span>
			hi
		</span>
	}
}

const mapStateToProps = state => ({
	report: state.report
})

export default connect(mapStateToProps)(Analyse)
