import {Trans} from '@lingui/react'
import {observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import {Container, Loader} from 'semantic-ui-react'
import {StoreContext} from 'store'

@observer
class LastFightRedirect extends Component {
	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				section: PropTypes.string.isRequired,
				code: PropTypes.string.isRequired,
				combatant: PropTypes.string,
			}).isRequired,
		}).isRequired,
	}

	static contextType = StoreContext

	componentDidMount() {
		// Make sure we've got report data
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
