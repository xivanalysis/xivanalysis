import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import JOBS, {ROLES} from 'data/JOBS'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Conductor} from 'parser/Conductor'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Header} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './Analyse.module.css'
import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'
import {AnalysisLoader} from 'components/ui/SharedLoaders'

@observer
class Analyse extends Component {
	static contextType = StoreContext

	@observable conductor;
	@observable complete = false;

	static propTypes = {
		report: PropTypes.object.isRequired,
		legacyReport: PropTypes.object.isRequired,
		pullId: PropTypes.string.isRequired,
		actorId: PropTypes.string.isRequired,
	}

	componentDidMount() {
		const {legacyReport} = this.props

		disposeOnUnmount(this, reaction(
			() => ({legacyReport}),
			this.fetchEventsAndParseIfNeeded,
			{fireImmediately: true},
		))
	}

	fetchEventsAndParseIfNeeded = async ({legacyReport}) => {
		// If we don't have everything we need, stop before we hit the api
		const valid = legacyReport && !legacyReport.loading
		if (!valid) { return }

		const {pullId, actorId} = this.props

		// We've got this far, boot up the conductor
		const fight = legacyReport.fights
			.find(fight => fight.id === parseInt(pullId, 10))
		const combatant = legacyReport.friendlies
			.find(friend => friend.id === parseInt(actorId, 10))
		const conductor = new Conductor({
			report: legacyReport,
			fight,
			combatant,
		})

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

	render() {
		const {report, pullId, actorId} = this.props

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!this.conductor || !this.complete) {
			return <AnalysisLoader/>
		}

		// Report's done, build output
		const actor = report
			.pulls.find(pull => pull.id === pullId)
			?.actors.find(actor => actor.id === actorId)
		const job = JOBS[actor.job]
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
