import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import Scroll from 'react-scroll'
import withSizes from 'react-sizes'
import {
	Container,
	Grid,
	Header,
	Loader,
	Menu,
	Segment,
	Sticky,
} from 'semantic-ui-react'

import {getFflogsEvents} from 'api'
import JobIcon from 'components/ui/JobIcon'
import JOBS, {ROLES} from 'data/JOBS'
import * as Errors from 'errors'
import AVAILABLE_MODULES from 'parser/AVAILABLE_MODULES'
import Parser from 'parser/core/Parser'
import {fetchReportIfNeeded, setGlobalError} from 'store/actions'
import {compose} from 'utilities'

import styles from './Analyse.module.css'
import fflogsLogo from './fflogs.png'

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
				combatant: PropTypes.string.isRequired,
			}).isRequired,
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
		}),
		showMenu: PropTypes.bool.isRequired,
	}

	stickyContext = null

	resultCache = null

	constructor(props) {
		super(props)

		this.state = {
			parser: null,
			complete: false,
			activeSegment: 0,
		}

		this.stickyContext = React.createRef()
	}

	componentDidMount() {
		this.fetchData()
	}

	componentDidUpdate(prevProps/* , prevState */) {
		// TODO: do i need this? mostly url updates
		this.fetchData(prevProps)
	}

	reset() {
		console.log('TODO: reset?')
	}

	fetchData(prevProps) {
		const {dispatch, match} = this.props

		// Make sure we've got a report, then run the parse
		dispatch(fetchReportIfNeeded(match.params.code))
		this.fetchEventsAndParseIfNeeded(prevProps)
	}

	fetchEventsAndParseIfNeeded(prevProps) {
		const {
			dispatch,
			report,
			match: {params},
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
				&& report.code === params.code
				&& params.fight
				&& params.combatant
			if (!valid) { return }

			// --- Sanity checks ---
			// Fight exists
			const fightId = parseInt(params.fight, 10)
			const fight = report.fights.find(fight => fight.id === fightId)
			if (!fight) {
				dispatch(setGlobalError(new Errors.NotFoundError({
					type: 'fight',
					id: fightId,
				})))
				return
			}

			// Combatant exists
			const combatantId = parseInt(params.combatant, 10)
			const combatant = report.friendlies.find(friend => friend.id === combatantId)
			if (!combatant) {
				dispatch(setGlobalError(new Errors.NotFoundError({
					type: 'friendly combatant',
					id: combatantId,
				})))
				return
			}

			// Combatant took part in fight
			if (!combatant.fights.find(fight => fight.id === fightId)) {
				dispatch(setGlobalError(new Errors.DidNotParticipateError({
					combatant: combatant.name,
					fight: fightId,
				})))
				return
			}

			// Maybe sanity check we have a parser for job? maybe a bit deeper? dunno ey
			this.fetchEventsAndParse(report, fight, combatant)
		}
	}

	async fetchEventsAndParse(report, fight, combatant) {
		// TODO: handle pets?
		// Build the base parser instance
		const parser = new Parser(report, fight, combatant)

		// Look up any modules we might want (inc. core)
		const modules = {
			core: AVAILABLE_MODULES.CORE,
			job: AVAILABLE_MODULES.JOBS[combatant.type],
			boss: AVAILABLE_MODULES.BOSSES[fight.boss],
		}

		// Load any modules we've got
		const modulePromises = []
		const loadOrder = ['core', 'boss', 'job']
		for (const group of loadOrder) {
			if (!modules[group]) { continue }
			modulePromises.push(modules[group]())
		}

		// If this throws, then there was a deploy between page load and this call. Tell them to refresh.
		try {
			(await Promise.all(modulePromises)).forEach(({default: loadedModules}, index) => {
				modules[loadOrder[index]] = loadedModules
				parser.addModules(loadedModules)
			})
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			this.props.dispatch(setGlobalError(new Errors.ModulesNotFoundError()))
			return
		}

		// Finalise the module structure & push all that into state
		parser.buildModules()
		this.setState({parser})

		// Grab the events
		let events = await getFflogsEvents(report.code, fight, {actorid: combatant.id})

		// Normalise the events before we parse them
		events = await parser.normalise(events)

		// TODO: Batch
		await parser.parseEvents(events)

		this.resultCache = null
		this.setState({complete: true})
	}

	getParserResults() {
		if (!this.resultCache) {
			this.resultCache = this.state.parser.generateResults()
		}

		return this.resultCache
	}

	getReportUrl() {
		const {
			report,
			match: {params},
		} = this.props

		return `https://www.fflogs.com/reports/${report.code}#fight=${params.fight}&source=${params.combatant}`
	}

	render() {
		const {
			parser,
			complete,
			activeSegment,
		} = this.state

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!parser || !complete) {
			return <Container>
				<Loader active>Loading analysis</Loader>
			</Container>
		}

		// Report's done, build output
		const job = JOBS[parser.player.type]
		const results = this.getParserResults()

		return <Container>
			<Grid>
				<Grid.Column mobile={16} computer={4}>
					{job && <Header
						className={[styles.header].join(' ')}
						attached="top"
					>
						<JobIcon job={job} set={1}/>
						<Header.Content>
							{job.name}
							<Header.Subheader>
								{ROLES[job.role].name}
							</Header.Subheader>
						</Header.Content>
					</Header>}
					<Header className={styles.header} attached={job? true : 'top'}>
						<img src="https://secure.xivdb.com/img/ui/enemy.png" alt="Generic enemy icon"/>
						<Header.Content>
							{parser.fight.name}
							<Header.Subheader>
								{parser.fight.zoneName}
							</Header.Subheader>
						</Header.Content>
					</Header>
					<Menu vertical attached="bottom">
						<Menu.Item as="a" href={this.getReportUrl()} target="_blank">
							<img src={fflogsLogo} alt="FF Logs logo" className={styles.menuLogo}/>
							View report on FF Logs
						</Menu.Item>
					</Menu>

					{this.props.showMenu && <Sticky context={this.stickyContext.current} offset={60}>
						<Menu vertical pointing secondary fluid>
							{results.map((result, index) => <Menu.Item
								// Menu.Item props
								key={index}
								active={activeSegment === index}
								as={Scroll.Link}
								// Scroll.Link props
								to={result.name}
								offset={-50}
								smooth
								spy
								onSetActive={() => this.setState({activeSegment: index})}
							>
								{result.name /* Doing manually so SUI doesn't modify my text */}
							</Menu.Item>)}
						</Menu>
					</Sticky>}
				</Grid.Column>

				<Grid.Column mobile={16} computer={12}>
					<div ref={this.stickyContext} className={styles.resultsContainer}>
						{results.map((result, index) =>
							<Segment vertical as={Scroll.Element} name={result.name} key={index}>
								<Header>{result.name}</Header>
								{result.markup}
							</Segment>
						)}
					</div>
				</Grid.Column>
			</Grid>
		</Container>
	}
}

const mapSizesToProps = ({width}) => ({
	showMenu: width >= 992,
})

const mapStateToProps = state => ({
	report: state.report,
})

export default compose(
	withSizes(mapSizesToProps),
	connect(mapStateToProps),
)(Analyse)
