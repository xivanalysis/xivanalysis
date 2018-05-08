import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import {
	Container,
	Grid,
	Header,
	Loader,
	Menu,
	Segment,
	Sticky
} from 'semantic-ui-react'
import Scroll from 'react-scroll'

import { fflogsApi } from 'api'
import JobIcon from 'components/ui/JobIcon'
import AVAILABLE_CONFIGS from 'parser/AVAILABLE_CONFIGS'
import { fetchReportIfNeeded } from 'store/actions'
import JOBS from 'data/JOBS'
import styles from './Analyse.module.css'

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
				combatant: PropTypes.string.isRequired
			}).isRequired
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired
		})
	}

	stickyContext = null

	resultCache = null

	constructor(props) {
		super(props)

		this.state = {
			config: null,
			parser: null,
			complete: false,
			activeSegment: 0
		}

		this.stickyContext = React.createRef()
	}

	componentWillMount() {
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
		const { dispatch, match } = this.props

		// Make sure we've got a report, then run the parse
		dispatch(fetchReportIfNeeded(match.params.code))
		this.fetchEventsAndParseIfNeeded(prevProps)
	}

	fetchEventsAndParseIfNeeded(prevProps) {
		const {
			report,
			match: { params }
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
				alert(`Fight ${fightId} does not exist in report "${report.title}".`)
				return
			}

			// Combatant exists
			const combatantId = parseInt(params.combatant, 10)
			const combatant = report.friendlies.find(friend => friend.id === combatantId)
			if (!combatant) {
				alert(`Combatant ${combatantId} does not exist in "${report.title}".`)
				return
			}

			// Combatant took part in fight
			if (!combatant.fights.find(fight => fight.id === fightId)) {
				alert(`${combatant.name} did not take part in fight ${fightId}.`)
				return
			}

			// Maybe sanity check we have a parser for job? maybe a bit deeper? dunno ey

			// console.log('fetchEventsAndParse', report, fight, combatant)
			this.fetchEventsAndParse(report, fight, combatant)
		}
	}

	async fetchEventsAndParse(report, fight, combatant) {
		// TODO: handle pets?

		// Get the config for the parser, stop now if there is none.
		const config = AVAILABLE_CONFIGS.find(config => config.job.logType === combatant.type)
		if (!config) {
			alert(`${JOBS[combatant.type].name} is not currently supported. Sorry!`)
			return
		}

		// Grab the parser for the combatant and broadcast an init to the modules
		const parser = new config.parser(report, fight, combatant)
		this.setState({ config: config, parser: parser})
		parser.fabricateEvent({type: 'init'})

		// TODO: Should this be somewhere else?
		// TODO: Looks like we don't need to paginate events requests any more... sure?
		const resp = await fflogsApi.get(`report/events/${report.code}`, {
			params: {
				start: fight.start_time,
				end: fight.end_time,
				actorid: combatant.id,
				// filter?
				translate: true // probs keep same?
			}
		})
		const events = resp.data.events

		// TODO: Batch
		parser.parseEvents(events)

		// We're done, signal to the parser as such
		parser.fabricateEvent({type: 'complete'})
		this.resultCache = null
		this.setState({complete: true})
	}

	getParserResults() {
		if (!this.resultCache) {
			this.resultCache = this.state.parser.generateResults()
		}

		return this.resultCache
	}

	render() {
		const {
			config,
			parser,
			complete,
			activeSegment
		} = this.state

		// Still loading the parser or running the parse
		// TODO: Nice loading bar and shit
		if (!parser || !complete) {
			return <Container>
				<Loader active>Loading analysis</Loader>
			</Container>
		}

		// Report's done, build output
		// TODO: Need to cache results so re-render for menu and so on doesn't trigger a re-render of the entire parser
		const results = this.getParserResults()

		return <Container>
			<Grid>
				<Grid.Column width={4}>
					<Header attached="top" className={styles.sidebar}>
						<JobIcon job={config.job} set={1}/>
						<Header.Content>
							{config.job.name}
							<Header.Subheader>
								Patch <strong>{config.patchCompatibility}</strong>
							</Header.Subheader>
						</Header.Content>
					</Header>
					<Segment attached="bottom">
						{config.description}
					</Segment>

					<Sticky context={this.stickyContext.current} offset={60}>
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
					</Sticky>
				</Grid.Column>
				<Grid.Column width={12}>
					<div ref={this.stickyContext}>
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

const mapStateToProps = state => ({
	report: state.report
})

export default connect(mapStateToProps)(Analyse)
