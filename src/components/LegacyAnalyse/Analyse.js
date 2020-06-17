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
		const {legacyReport, fight, combatant} = this.props

		disposeOnUnmount(this, reaction(
			() => ({
				legacyReport,
				params: {fight, combatant},
			}),
			this.fetchEventsAndParseIfNeeded,
			{fireImmediately: true},
		))
	}

	fetchEventsAndParseIfNeeded = async ({legacyReport, params}) => {
		// If we don't have everything we need, stop before we hit the api
		// TODO: more checks
		const valid = legacyReport
				&& !legacyReport.loading
				&& params.fight
				&& params.combatant
		if (!valid) { return }

		// We've got this far, boot up the conductor
		const fight = legacyReport.fights.find(fight => fight.id === this.fightId)
		const combatant = legacyReport.friendlies.find(friend => friend.id === this.combatantId)
		const conductor = new Conductor(legacyReport, fight, combatant)

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
		const {report, fight, combatant} = this.props

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!this.conductor || !this.complete) {
			return <AnalysisLoader/>
		}

		// Report's done, build output
		const actor = report
			.pulls.find(pull => pull.id === fight)
			?.actors.find(actor => actor.id === combatant)
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
