import _ from 'lodash'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Trans} from '@lingui/react'
import {
	Header,
	Loader,
} from 'semantic-ui-react'

import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import JOBS, {ROLES} from 'data/JOBS'
import {Conductor} from 'parser/Conductor'
import {fetchReportIfNeeded, setGlobalError} from 'store/actions'
import {compose} from 'utilities'

import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'

import styles from './Analyse.module.css'
import fflogsLogo from './fflogs.png'

class Analyse extends Component {
	// TODO: I should really make a definitions file for this shit
	static propTypes = {
		dispatch: PropTypes.func.isRequired,
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string.isRequired,
				combatant: PropTypes.string.isRequired,
			}).isRequired,
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
		}),
	}

	get fightId() {
		return parseInt(this.props.match.params.fight, 10)
	}

	get combatantId() {
		return parseInt(this.props.match.params.combatant, 10)
	}

	constructor(props) {
		super(props)

		this.state = {
			conductor: null,
			complete: false,
		}
	}

	componentDidMount() {
		this.fetchData()
	}

	componentDidUpdate(prevProps/* , prevState */) {
		// TODO: do i need this? mostly url updates
		this.fetchData(prevProps)
	}

	fetchData(prevProps) {
		const {dispatch, match} = this.props

		// Make sure we've got a report, then run the parse
		dispatch(fetchReportIfNeeded(match.params.code))
		this.fetchEventsAndParseIfNeeded(prevProps)
	}

	async fetchEventsAndParseIfNeeded(prevProps) {
		const {
			dispatch,
			report,
			match: {params},
		} = this.props

		// TODO: actually check if needed
		const changed = !prevProps
			|| report !== prevProps.report
			|| !_.isEqual(params, prevProps.match.params)
		if (!changed) {
			return
		}

		// If we don't have everything we need, stop before we hit the api
		// TODO: more checks
		const valid = report
				&& !report.loading
				&& report.code === params.code
				&& params.fight
				&& params.combatant
		if (!valid) { return }

		// We've got this far, boot up the conductor
		const fight = report.fights.find(fight => fight.id === this.fightId)
		const combatant = report.friendlies.find(friend => friend.id === this.combatantId)
		const conductor = new Conductor(report, fight, combatant)

		try {
			conductor.sanityCheck()
			await conductor.configure()
		} catch (error) {
			dispatch(setGlobalError(error))
			return
		}

		this.setState({conductor})

		// Run the parse and signal completion
		await conductor.parse()
		this.setState({complete: true})
	}

	getReportUrl() {
		const {
			report,
			match: {params},
		} = this.props

		return `https://www.fflogs.com/reports/${report.code}#fight=${params.fight}&source=${params.combatant}`
	}

	render() {
		const {report} = this.props
		const {
			conductor,
			complete,
		} = this.state

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!conductor || !complete) {
			return (
				<Loader active>
					<Trans id="core.analyse.load-analysis">
						Loading analysis
					</Trans>
				</Loader>
			)
		}

		// Report's done, build output
		const player = report.friendlies.find(friend => friend.id === this.combatantId)
		const job = JOBS[player.type]
		const results = conductor.getResults()

		return <SegmentPositionProvider>
			<SidebarContent>
				{job && <Header
					className={[styles.header].join(' ')}
				>
					<JobIcon job={job}/>
					<Header.Content>
						<Trans id={job.i18n_id} defaults={job.name} />
						<Header.Subheader>
							<Trans id={ROLES[job.role].i18n_id} defaults={ROLES[job.role].name} />
						</Header.Subheader>
					</Header.Content>
				</Header>}

				{results.map(
					(result, index) => <SegmentLinkItem
						key={index}
						index={index}
						result={result}
					/>
				)}

				<a
					href={this.getReportUrl()}
					target="_blank"
					rel="noopener noreferrer"
					className={styles.reportLink}
				>
					<img src={fflogsLogo} alt="FF Logs logo" className={styles.menuLogo}/>
					<Trans id="core.analyse.view-on-fflogs">
						View report on FF Logs
					</Trans>
				</a>
			</SidebarContent>

			{results.map((result, index) => <ResultSegment index={index} result={result} key={index}/>)}
		</SegmentPositionProvider>
	}
}

const mapStateToProps = state => ({
	report: state.report,
})

export default compose(
	connect(mapStateToProps),
)(Analyse)
