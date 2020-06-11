import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getDataBy} from 'data'
import JOBS, {ROLES} from 'data/JOBS'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Conductor} from 'parser/Conductor'
import PropTypes from 'prop-types'
import React, {Component, useContext} from 'react'
import {Header} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './Analyse.module.css'
import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'
import {ReportLoader, AnalysisLoader} from 'components/ui/SharedLoaders'

function AnalyseRouteWrapper({match: {params}}) {
	const {reportStore} = useContext(StoreContext)
	reportStore.fetchReportIfNeeded(params.code)
	const report = reportStore.report

	if (
		report?.loading !== false
		|| report.code !== params.code
	) {
		return <ReportLoader/>
	}

	return (
		<Analyse
			report={report}
			fight={params.fight}
			combatant={params.combatant}
		/>
	)
}
AnalyseRouteWrapper.propTypes = {
	match: PropTypes.shape({
		params: PropTypes.shape({
			code: PropTypes.string.isRequired,
			fight: PropTypes.string.isRequired,
			combatant: PropTypes.string.isRequired,
		}).isRequired,
	}).isRequired,
}
export default observer(AnalyseRouteWrapper)

@observer
class Analyse extends Component {
	static contextType = StoreContext

	@observable conductor;
	@observable complete = false;

	static propTypes = {
		report: PropTypes.object.isRequired,
		fight: PropTypes.string.isRequired,
		combatant: PropTypes.string.isRequired,
	}

	get fightId() {
		return parseInt(this.props.fight, 10)
	}

	get combatantId() {
		return parseInt(this.props.combatant, 10)
	}

	componentDidMount() {
		const {report, fight, combatant} = this.props

		disposeOnUnmount(this, reaction(
			() => ({
				report,
				params: {fight, combatant},
			}),
			this.fetchEventsAndParseIfNeeded,
			{fireImmediately: true},
		))
	}

	fetchEventsAndParseIfNeeded = async ({report, params}) => {
		// If we don't have everything we need, stop before we hit the api
		// TODO: more checks
		const valid = report
				&& !report.loading
				&& params.fight
				&& params.combatant
		if (!valid) { return }

		// We've got this far, boot up the conductor
		const fight = report.fights.find(fight => fight.id === this.fightId)
		const combatant = report.friendlies.find(friend => friend.id === this.combatantId)
		const conductor = new Conductor(report, fight, combatant)

		// Run checks, then the parse. Throw any errors up to the error store.
		try {
			conductor.sanityCheck()
			await conductor.configure()
			await conductor.parse()
		} catch (error) {
			this.context.globalErrorStore.setGlobalError(error)
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			return
		}

		// Signal completion
		runInAction(() => {
			this.conductor = conductor
			this.complete = true
		})
	}

	getReportUrl() {
		const {report, fight, combatant} = this.props
		return `https://www.fflogs.com/reports/${report.code}#fight=${fight}&source=${combatant}`
	}

	render() {
		const report = this.props.report

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!this.conductor || !this.complete) {
			return <AnalysisLoader/>
		}

		// Report's done, build output
		const player = report.friendlies.find(friend => friend.id === this.combatantId)
		const job = getDataBy(JOBS, 'logType', player.type)
		const role = job? ROLES[job.role] : undefined
		const results = this.conductor.getResults()

		return <SegmentPositionProvider>
			<SidebarContent>
				{job && (
					<Header className={styles.header}>
						<JobIcon job={job}/>
						<Header.Content>
							<NormalisedMessage message={job.name}/>
							{role && (
								<Header.Subheader>
									<NormalisedMessage message={role.name}/>
								</Header.Subheader>
							)}
						</Header.Content>
					</Header>
				)}

				{results.map((result, index) => (
					<SegmentLinkItem
						key={index}
						index={index}
						result={result}
					/>
				))}
			</SidebarContent>

			<div className={styles.resultsContainer}>
				{results.map((result, index) => (
					<ResultSegment index={index} result={result} key={index}/>
				))}
			</div>
		</SegmentPositionProvider>
	}
}

export {Analyse}
