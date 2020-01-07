import {Trans} from '@lingui/react'
import {SidebarContent} from 'components/GlobalSidebar'
import JobIcon from 'components/ui/JobIcon'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getDataBy} from 'data'
import JOBS, {ROLES} from 'data/JOBS'
import {observable, reaction, runInAction} from 'mobx'
import {ActorType} from 'fflogs'
import {disposeOnUnmount, observer} from 'mobx-react'
import TeaConductor from './TeaConductor'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Header, Loader} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './Teatime.module.css'
import ResultSegment from './ResultSegment'
import SegmentLinkItem from './SegmentLinkItem'
import {SegmentPositionProvider} from './SegmentPositionContext'

@observer
class Teatime extends Component {
	static contextType = StoreContext

	@observable conductors;
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

	groupedActors(friendlies, currentFight) {
		if (!friendlies.length) {
			return []
		}
		return friendlies.filter((friendly) => {
			const inFight = friendly.fights.some(fight => fight.id === currentFight)
			const type = friendly.type
			return !(
				type === ActorType.LIMIT_BREAK ||
				type === ActorType.NPC ||
				!inFight
			)
		})
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
			{fireImmediately: true},
		))
	}

	componentDidUpdate(prevProps) {
		// report.code, params.fight
		const {match: {params: {code: prevCode, fight: prevFight}}} = prevProps
		const {match: {params: {code, fight}}} = this.props

		if (prevCode !== code || prevFight !== fight) {
			const {reportStore} = this.context
			const {match} = this.props
			reportStore.fetchReportIfNeeded(match.params.code)

			disposeOnUnmount(this, reaction(
				() => ({
					report: reportStore.report,
					params: match.params,
				}),
				this.fetchEventsAndParseIfNeeded,
				{fireImmediately: true},
			))
		}
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

		const combatants = this.groupedActors(report.friendlies, this.fightId)
		// Temporary solution to just grab one user and party from them
		const conductors = [new TeaConductor(report, fight, combatants[0])]
		// const conductors = combatants.map(combatant => new TeaConductor(report, fight, combatant))

		// const combatant = report.friendlies.find(friend => friend.id === this.combatantId)
		// const conductor = new TeaConductor(report, fight, combatant, true)
		// const otherCombatant = report.friendlies.find(friend => friend.id === (this.combatantId+1))
		// const otherConductor = new TeaConductor(report, fight, otherCombatant, true)

		// Run checks, then the parse. Throw any errors up to the error store.
		try {
			await Promise.all(conductors.map(async conductor => {
				conductor.sanityCheck()
				await conductor.configure()
				await conductor.parse()
			}))

		} catch (error) {
			this.context.globalErrorStore.setGlobalError(error)
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			return
		}

		// Signal completion
		runInAction(() => {
			this.conductors = conductors
			this.complete = true
		})
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
		if (!this.conductors || !this.complete) {
			return (
				<Loader active>
					<Trans id="core.analyse.load-analysis">
						Loading analysis
					</Trans>
				</Loader>
			)
		}

		// Report's done, build output
		// KC: These fields don't really apply to us anymore that we're looking at the whole fight
		const player = report.friendlies.find(friend => friend.id === this.combatantId)
		const job = getDataBy(JOBS, 'logType', player.type)
		const role = job? getDataBy(ROLES, 'id', job.role) : undefined

		const allResults = this.conductors.map(conductor => conductor.getResults())
		const timelineResults = allResults.flat().filter(result => result.handle === 'timeline')

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

				{timelineResults.map((result, index) => (
					<SegmentLinkItem
						key={index}
						index={index}
						result={result}
					/>
				))}
			</SidebarContent>

			<div className={styles.resultsContainer}>
				{timelineResults.map((result, index) => (
					<ResultSegment index={index} result={result} key={index}/>
				))}
			</div>
		</SegmentPositionProvider>
	}
}

export default Teatime
