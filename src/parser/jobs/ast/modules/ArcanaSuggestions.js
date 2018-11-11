import React, {Fragment} from 'react'
import _ from 'lodash'

import Module from 'parser/core/Module'
import ACTIONS, {getAction} from 'data/ACTIONS'
// import STATUSES, {getStatus} from 'data/STATUSES'

import {DRAWN_ARCANA_USE, HELD_ARCANA_USE, SPEAR_USED} from './ArcanaGroups'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import JobIcon from 'components/ui/JobIcon'
import JOBS from 'data/JOBS'
import {ActionLink} from 'components/ui/DbLink'
import {Trans, i18nMark} from '@lingui/react'
import {Table, Icon, Message, Label, Accordion} from 'semantic-ui-react'

import styles from './ArcanaSuggestions.module.css'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class ArcanaSuggestions extends Module {
	static handle = 'arcanaSuggestions'
	static title = 'Arcana Logs'
	static i18n_id = i18nMark('ast.arcana-suggestions.title')
	static displayOrder = DISPLAY_ORDER.ARCANA_TRACKING
	static dependencies = [
		'suggestions',
		'combatants',
		'arcanaTracking',
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

			const isArcana = artifact.lastEvent && [...DRAWN_ARCANA_USE, ...HELD_ARCANA_USE].includes(artifact.lastEvent.ability.guid)
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
					rrAbility: artifact.lastEvent.rrAbility,
				} : null,
				state: {
					rrAbility: artifact.rrAbility,
					spread: artifact.spreadState,
					draw: artifact.drawState,
					minorArcana: artifact.minorState,
				},
			}
		})

	}

	// Card management critique follows

	_watchDropBalance() {
		//
	}

	_watchBardNoSpear() {
		if (!this.partyComp.includes('Bard')) {
			return
		}

		let count = 0

		_.each(this.cardLogs, (artifact) => {
			if (artifact.lastAction
				&& artifact.lastAction.targetJob !== 'Bard'
				&& SPEAR_USED.includes(artifact.lastAction.id)
			) {
				count++
				artifact.message = <Fragment>
					<Icon name="warning sign"/> <Label horizontal content="Medium" color="orange" /> Suggestion logged for this action
				</Fragment>
			}
		})

		if (count > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THE_SPEAR.icon,
				content: <Trans id="ast.arcana-suggestions.suggestions.bardnospear.content">
					Bards gain bonuses when they make criticals, so they should be the recipient of single-target Spears instead.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="ast.arcana-suggestions.suggestions.bardnospear.why">
					{count} Spear arcanas not given to bard.
				</Trans>,
			}))
		}

	}

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
				content: <Table collapsing unstackable className={styles.cardActionTable}>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell width={1}>
								<Trans id="ast.arcana-suggestions.messages.time">
											Time
								</Trans>
							</Table.HeaderCell>
							<Table.HeaderCell width={4}>
								<Trans id="ast.arcana-suggestions.messages.latest-action">Lastest Action</Trans>
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
							{this.RenderSpreadState(pullState)}
						</Table.Row>

						{this.cardLogs.map(artifact => {
							return <Table.Row key={artifact.timestamp} className={styles.cardActionRow}>
								<Table.Cell>{this.parser.formatTimestamp(artifact.timestamp)}</Table.Cell>
								{this.RenderAction(artifact)}
								{this.RenderSpreadState(artifact)}
							</Table.Row>
						})}
					</Table.Body>
				</Table>,
			},
		}]

		return <Fragment>
			<p>
				<Trans id="ast.arcana-suggestions.messages.explanation">
					This section keeps track of every card action made during the fight, and the state of the spread after each action.
				</Trans>
			</p>
			<Message warning icon>
				<Icon name="warning sign"/>
				<Message.Content>
					<Trans id="ast.arcana-suggestions.messages.disclaimer">
							Card management critique is still a work in progress. No recommendations are being made yet. <br/>
							The intention of this section is to give a general recommendation of best practices. It will not take into consideration which party member was playing better, or whether they were in burst phase.
					</Trans>
				</Message.Content>
			</Message>
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
			return <Table.Cell>
				<ActionLink {...getAction(artifact.lastAction.id)} />
				{status && <img
					src={status.icon}
					className={styles.buffIcon}
					alt={status.name}
				/> }<br/>
				{artifact.lastAction.targetJob &&
					<JobIcon
						job={JOBS[artifact.lastAction.targetJob]}
						className={styles.jobIcon}
					/>
				}

				{artifact.lastAction.targetName}
			</Table.Cell>
		}
		return <Table.Cell>
			{artifact.lastAction.overrideDBlink &&
				<Fragment>{artifact.lastAction.actionName}</Fragment>
			}
			{!artifact.lastAction.overrideDBlink &&
				<ActionLink {...getAction(artifact.lastAction.id)} />
			}
		</Table.Cell>

	}

	// Helper for output()
	RenderSpreadState(artifact) {

		const spread = artifact.state.spread || null
		const draw = artifact.state.draw || null
		const rrAbility = artifact.state.rrAbility || null
		const minorArcana = artifact.state.minorArcana

		return <Table.Cell>
			{rrAbility && <img
				src={rrAbility.icon}
				className={styles.buffIcon}
				alt={rrAbility.name}
			/>}
			{!rrAbility && <span className={styles.buffDummy} />}
			<br/>
			{spread && <img
				src={spread.icon}
				className={styles.buffIcon}
				alt={spread.name}
			/>}
			{!spread && <span className={styles.buffDummy} />}
			{draw && <img
				src={draw.icon}
				className={styles.buffIcon}
				alt={draw.name}
			/>}
			{!draw && <span className={styles.buffDummy} />}
			{minorArcana && minorArcana.name === 'Unknown' &&
				<span className={styles.buffUnknown}><span>?</span></span>
			}
			{minorArcana && minorArcana.name !== 'Unknown' && <img
				src={minorArcana.icon}
				className={styles.spreadSlot3}
				alt={minorArcana.name}
			/>}
			{!minorArcana && <span className={styles.buffDummy} />}
		</Table.Cell>
	}

	// Helper for output()
	RenderRemark(artifact) {
		return <Table.Cell>
			{artifact.message}
		</Table.Cell>
	}

}
