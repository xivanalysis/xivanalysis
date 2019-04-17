import {Trans} from '@lingui/react'
import {getActorId} from '@xivanalysis/parser-reader-fflogs'
import {observable, runInAction, reaction} from 'mobx'
import {inject, observer, disposeOnUnmount} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {
	Header,
	Loader,
} from 'semantic-ui-react'

import {Analyser} from 'analyser/Analyser'
import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import JOBS, {ROLES} from 'data/JOBS'
import {ReportStore} from 'store/report'
import {GlobalErrorStore} from 'store/globalError'

import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'
import {fflogsPipeline} from './FflogsPipeline'

import styles from './Analyse.module.css'

@inject('reportStore', 'globalErrorStore')
@observer
class Analyse extends Component {
	@observable analyser;
	@observable complete = false;

	// TODO: I should really make a definitions file for this shit
	static propTypes = {
		reportStore: PropTypes.instanceOf(ReportStore).isRequired,
		globalErrorStore: PropTypes.instanceOf(GlobalErrorStore),
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
		const {reportStore, match} = this.props
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

		// We've got this far, try to retrieve & parse the events
		const fight = report.fights.find(fight => fight.id === this.fightId)
		const combatant = report.friendlies.find(friend => friend.id === this.combatantId)

		let analyser
		try {
			const events = await fflogsPipeline({report, fight, combatant})
			analyser = new Analyser({
				events,
				actorId: getActorId({actor: combatant}),
				zoneId: fight.zoneID,
			})
			analyser.loadModules()
		} catch (error) {
			this.props.globalErrorStore.setGlobalError(error)
			return
		}

		runInAction(() => this.analyser = analyser)

		// Run the analysis and signal completion
		// TODO: Run the analyser
		runInAction(() => this.complete = true)
	}

	getReportUrl() {
		const {match: {params}} = this.props
		return `https://www.fflogs.com/reports/${params.code}#fight=${params.fight}&source=${params.combatant}`
	}

	render() {
		const {reportStore} = this.props
		const report = reportStore.report

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!this.analyser || !this.complete) {
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
		// TODO: Get output kek
		const results = []

		return <SegmentPositionProvider>
			<SidebarContent>
				{job && <Header
					className={[styles.header].join(' ')}
				>
					<JobIcon job={job}/>
					<Header.Content>
						<NormalisedMessage message={job.name}/>
						<Header.Subheader>
							<NormalisedMessage message={ROLES[job.role].name}/>
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
