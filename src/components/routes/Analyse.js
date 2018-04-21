import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { fflogsApi } from '@/api'
import AVAILABLE_CONFIGS from '@/parser/AVAILABLE_CONFIGS'
import { fetchReportIfNeeded } from '@/store/actions'

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
		const {
			report,
			match: { params }
		} = this.props

		// TODO: actually check if needed
		const changed = !prevProps
			|| report !== prevProps.report
			|| params !== prevProps.match.params
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

			// --- Sanity checks ---
			// Fight exists
			const fightId = parseInt(params.fight, 10)
			const fight = report.fights.find(fight => fight.id === fightId)
			if (!fight) {
				alert(`Fight ${fightId} does not exist in report "${report.title}".`)
				return
			}

			// Combatant exists
			const combatantId = parseInt(params.combatant, 10)
			const combatant = report.friendlies.find(friend => friend.id === combatantId)
			if (!combatant) {
				alert(`Combatant ${combatantId} does not exist in "${report.title}".`)
				return
			}

			// Combatant took part in fight
			if (!combatant.fights.find(fight => fight.id === fightId)) {
				alert(`${combatant.name} did not take part in fight ${fightId}.`)
				return
			}

			// Maybe sanity check we have a parser for job? maybe a bit deeper? dunno ey

			// console.log('fetchEventsAndParse', report, fight, combatant)
			this.fetchEventsAndParse(report, fight, combatant)
		}
	}

	async fetchEventsAndParse(report, fight, combatant) {
		// TODO: handle pets?

		// Grab the parser for the combatant and broadcast an init to the modules
		const config = AVAILABLE_CONFIGS.find(config => config.job.logType === combatant.type)
		const parser = new config.parser(report, fight, combatant)
		parser.fabricateEvent({type: 'init'})

		// TODO: Should this be somewhere else?
		// TODO: Looks like we don't need to paginate events requests any more... sure?
		const resp = await fflogsApi.get(`report/events/${report.code}`, {
			params: {
				start: fight.start_time,
				end: fight.end_time,
				actorid: combatant.id,
				// filter?
				translate: true // probs keep same?
			}
		})
		const events = resp.data.events

		// TODO: Batch
		parser.parseEvents(events)

		// We're done, signal to the parser as such
		parser.fabricateEvent({type: 'complete'})
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
