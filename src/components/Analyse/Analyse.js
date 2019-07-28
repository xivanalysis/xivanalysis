import {Trans} from '@lingui/react'
import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getDataBy} from 'data'
import JOBS, {ROLES} from 'data/JOBS'
import {observable, reaction, runInAction} from 'mobx'
import {disposeOnUnmount, observer} from 'mobx-react'
import {Conductor} from 'parser/Conductor'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Header, Loader} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './Analyse.module.css'
import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'

@observer
class Analyse extends Component {
	static contextType = StoreContext

	@observable conductor;
	@observable complete = false;

	// TODO: I should really make a definitions file for this shit
	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				code: PropTypes.string.isRequired,
				fight: PropTypes.string.isRequired,
				combatant: PropTypes.string.isRequired,
			}).isRequired,
		}).isRequired,
	}

	get fightId() {
		return parseInt(this.props.match.params.fight, 10)
	}

	get combatantId() {
		return parseInt(this.props.match.params.combatant, 10)
	}

	componentDidMount() {
		const {reportStore} = this.context
		const {match} = this.props
		reportStore.fetchReportIfNeeded(match.params.code)

		disposeOnUnmount(this, reaction(
			() => ({
				report: reportStore.report,
				params: match.params,
			}),
			this.fetchEventsAndParseIfNeeded,
			{fireImmediately: true}
		))
	}

	fetchEventsAndParseIfNeeded = async ({report, params}) => {
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
			this.context.globalErrorStore.setGlobalError(error)
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			return
		}

		runInAction(() => this.conductor = conductor)

		// Run the parse and signal completion
		await conductor.parse()
		runInAction(() => this.complete = true)
	}

	getReportUrl() {
		const {match: {params}} = this.props
		return `https://www.fflogs.com/reports/${params.code}#fight=${params.fight}&source=${params.combatant}`
	}

	render() {
		const {reportStore} = this.context
		const report = reportStore.report

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!this.conductor || !this.complete) {
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
		const job = getDataBy(JOBS, 'logType', player.type)
		const role = job? getDataBy(ROLES, 'id', job.role) : undefined
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

export default Analyse
