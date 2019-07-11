import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import JobIcon from 'components/ui/JobIcon'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import Module from 'parser/core/Module'
import React, {Fragment} from 'react'
import {Accordion, Button, Table} from 'semantic-ui-react'
import {PLAY} from './ArcanaGroups'
import styles from './ArcanaSuggestions.module.css'
// import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// const LADY_OF_CROWNS_STATUS_ICON = 'https://xivapi.com/i/014000/014840.png'
// const LORD_OF_CROWNS_STATUS_ICON = 'https://xivapi.com/i/014000/014841.png'
// const UNKNOWN_CARD_STATUS_ICON = 'https://xivapi.com/i/010000/010205.png'

const timelineLinkLowerMod = 0 // in ms
const timelineLinkUpperMod = 30000 // in ms

export default class ArcanaSuggestions extends Module {
	static handle = 'arcanaSuggestions'

	static title = t('ast.arcana-suggestions.title')`Arcana Logs`
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING
	static dependencies = [
		// 'suggestions',
		'combatants',
		'arcanaTracking',
		'timeline',
	]

	cardLogs = []
	partyComp = []

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)

	}

	_onComplete() {
		const combatants = this.combatants.getEntities()
		for (const key in combatants) {

			if (combatants[key].type === 'LimitBreak') {
				continue
			}
			this.partyComp.push(combatants[key].type)
		}

		this.cardLogs = this.arcanaTracking.getCardLogs.map(artifact => {

			const isArcana = artifact.lastEvent && [...PLAY].includes(artifact.lastEvent.ability.guid)
			const target = isArcana ? this.combatants.getEntity(artifact.lastEvent.targetID) : null
			const targetName = target ? target.name : null
			const targetJob = target ? target.type : null

			return {
				timestamp: artifact.lastEvent ? artifact.lastEvent.timestamp : this.parser.fight.start_time,
				lastAction: artifact.lastEvent ? {
					id: artifact.lastEvent.ability.guid,
					actionName: artifact.lastEvent.ability.name,
					targetName: targetName,
					targetJob: targetJob,
					isArcana: isArcana,
					overrideDBlink: artifact.lastEvent.overrideDBlink,
				} : null,
				state: {
					draw: artifact.drawState,
					slot1: artifact.slot1State,
					slot2: artifact.slot2State,
					slot3: artifact.slot3State,
				},
			}
		})

	}

	// Card management critique follows

	// _watchDropBalance() {
	// 	//
	// }

	// _watchBardNoSpear() {
	// 	if (!this.partyComp.includes('Bard')) {
	// 		return
	// 	}

	// 	let count = 0

	// 	_.each(this.cardLogs, (artifact) => {
	// 		if (artifact.lastAction
	// 			&& artifact.lastAction.targetJob !== 'Bard'
	// 		) {
	// 			count++
	// 			artifact.message = <Fragment>
	// 				<Icon name="warning sign"/> <Label horizontal content="Medium" color="orange" /> Suggestion logged for this action
	// 			</Fragment>
	// 		}
	// 	})

	// 	if (count > 0) {
	// 		this.suggestions.add(new Suggestion({
	// 			icon: ACTIONS.THE_SPEAR.icon,
	// 			content: <Trans id="ast.arcana-suggestions.suggestions.bardnospear.content">
	// 				Bards gain bonuses when they make criticals, so they should be the recipient of single-target Spears instead.
	// 			</Trans>,
	// 			severity: SEVERITY.MEDIUM,
	// 			why: <Trans id="ast.arcana-suggestions.suggestions.bardnospear.why">
	// 				{count} Spear arcanas not given to bard.
	// 			</Trans>,
	// 		}))
	// 	}

	// }

	output() {

		const pullState = this.cardLogs.shift()

		// The header cell for when we do get suggestions
		// <Table.HeaderCell width={4}>
		//					<Trans id="ast.arcana-suggestions.messages.header4">Remarks</Trans></Table.HeaderCell>
		// {this.RenderRemark(artifact)}

		const cardDisplayPanel = [{
			key: 'arcana-logs',
			title: {
				content: <Trans id="ast.arcana-suggestions.messages.accordion-title">Full Arcana Logs</Trans>,
			},
			content: {

				content: <><Table collapsing unstackable className={styles.cardActionTable}>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell width={1}>
								<Trans id="ast.arcana-suggestions.messages.time">
											Time
								</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell width={1}>
								<Trans id="ast.arcana-suggestions.messages.latest-action">Lastest Action</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell width={2}>
								<Trans id="ast.arcana-suggestions.messages.target">Target</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell width={2}>
								<Trans id="ast.arcana-suggestions.messages.spread-state">Spread State</Trans>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row key={pullState.timestamp} className={styles.cardActionRow}>
							<Table.Cell>{this.parser.formatTimestamp(pullState.timestamp)}</Table.Cell>
							<Table.Cell>
								<Trans id="ast.arcana-suggestions.messages.pull">
											Pull
								</Trans>
							</Table.Cell>
							<Table.Cell>
							</Table.Cell>
							{this.RenderSpreadState(pullState)}
						</Table.Row>

						{this.cardLogs.map(artifact => {
							return <Table.Row key={artifact.timestamp} className={styles.cardActionRow}>

								<Table.Cell>
									<a onClick={() => this.jumpToTimeline(artifact.timestamp)}>
										{this.parser.formatTimestamp(artifact.timestamp)}</a>
								</Table.Cell>
								{this.RenderAction(artifact)}
								{this.RenderSpreadState(artifact)}
							</Table.Row>
						})}
					</Table.Body>

				</Table>
				<Button onClick={() => this.parser.scrollTo(this.constructor.handle)}>
					<Trans id="ast.arcana-suggestions.scroll-to-top-button">Jump to start of Arcana Logs</Trans>
				</Button>
				</>
				,
			},
		}]

		return <Fragment>
			<p>
				<Trans id="ast.arcana-suggestions.messages.explanation">
					This section keeps track of every card action made during the fight, and the state of the spread after each action.
				</Trans>
			</p>
			{/* <Message warning icon>
				<Icon name="warning sign"/>
				<Message.Content>
					<Trans id="ast.arcana-suggestions.messages.disclaimer">
							The intention of this section is to give a general recommendation of best practices. It will not take into consideration which party member was playing better, or whether they were in burst phase.
					</Trans>
				</Message.Content>
			</Message> */}
			<Accordion
				exclusive={false}
				panels={cardDisplayPanel}
				styled
				fluid
			/>

		</Fragment>
	}

	// Helper for output()
	RenderAction(artifact) {
		if (artifact.lastAction.isArcana) {
			const status = artifact.lastAction.rrAbility || null
			const targetJob = getDataBy(JOBS, 'logType', artifact.lastAction.targetJob)

			return <>
			<Table.Cell>
				<ActionLink {...getDataBy(ACTIONS, 'id', artifact.lastAction.id)} />
				{status && <img
					src={status.icon}
					className={styles.buffIcon}
					alt={status.name}
				/> }
			</Table.Cell>
			<Table.Cell>
				{targetJob && <JobIcon job={targetJob}/>}
				{artifact.lastAction.targetName}
			</Table.Cell>
			</>
		}
		return <><Table.Cell>
			{artifact.lastAction.overrideDBlink &&
				<Fragment>{artifact.lastAction.actionName}</Fragment>
			}
			{!artifact.lastAction.overrideDBlink &&
				<ActionLink {...getDataBy(ACTIONS, 'id', artifact.lastAction.id)} />
			}
		</Table.Cell>
		<Table.Cell>
		</Table.Cell>
		</>

	}

	// Helper for output()
	RenderSpreadState(artifact) {

		const draw = artifact.state.draw || null
		const slot1 = artifact.state.slot1 || null
		const slot2 = artifact.state.slot2 || null
		const slot3 = artifact.state.slot3 || null

		return <Table.Cell>
			{draw && <img
				src={draw.icon}
				className={styles.buffIcon}
				alt={draw.name}
			/>}
			{!draw && <span className={styles.buffDummy} />}&nbsp;&nbsp;&nbsp;&nbsp;
			{slot1 && <img
				src={slot1.icon}
				className={styles.buffIcon}
				alt={slot1.name}
			/>}
			{!slot1 && <span className={styles.buffDummy} />}
			{slot2 && <img
				src={slot2.icon}
				className={styles.buffIcon}
				alt={slot2.name}
			/>}
			{!slot2 && <span className={styles.buffDummy} />}
			{slot3 && <img
				src={slot3.icon}
				className={styles.buffIcon}
				alt={slot3.name}
			/>}
			{!slot3 && <span className={styles.buffDummy} />}
		</Table.Cell>
	}

	// GetMinorArcanaIcon(action) {
	// 	if (action.id === ACTIONS.LORD_OF_CROWNS.id) {
	// 		return LORD_OF_CROWNS_STATUS_ICON
	// 	} if (action.id === ACTIONS.LADY_OF_CROWNS.id) {
	// 		return LADY_OF_CROWNS_STATUS_ICON
	// 	}
	// 	return UNKNOWN_CARD_STATUS_ICON

	// }

	jumpToTimeline(timestamp) {
		this.timeline.show(
			(timestamp - timelineLinkLowerMod) - this.parser.fight.start_time,
			(timestamp + timelineLinkUpperMod) - this.parser.fight.start_time
		)
	}

	// Helper for output()
	RenderRemark(artifact) {
		return <Table.Cell>
			{artifact.message}
		</Table.Cell>
	}

}
