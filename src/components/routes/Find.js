import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { fetchReportIfNeeded } from '@/store/actions'
import FightList from '@/components/ui/FightList'

class Find extends Component {
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string
			}).isRequired
		}).isRequired,
		report: PropTypes.shape({
			title: PropTypes.string.isRequired,
			fights: PropTypes.arrayOf(PropTypes.shape({
				// Not isRequired 'cus some fights (super short) seem to miss a lot of fields
				boss: PropTypes.integer,
				kill: PropTypes.bool
			})).isRequired
		})
	}

	componentDidMount() {
		const { dispatch, match } = this.props
		dispatch(fetchReportIfNeeded(match.params.code))
	}

	render() {
		const { report } = this.props

		// TODO: should this logic be in the FightList, considering I might reuse that?

		// If report is null, we're probably waiting for an api call to complete
		if (report === null) {
			return <span>Loading...</span>
		}

		// Filter out boss === 0, they seem to be dodgy parses and i ceebs dealing
		let fights = report.fights.filter(fight => fight.boss !== 0)

		return (
			<div className="container">
				<h1>{report.title}</h1>
				<FightList fights={fights}/>
			</div>
		)
	}
}

const mapStateToProps = state => ({
	report: state.report
})

export default connect(mapStateToProps)(Find)
