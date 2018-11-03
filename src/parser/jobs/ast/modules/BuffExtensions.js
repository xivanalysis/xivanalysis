import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import JobIcon from 'components/ui/JobIcon'
import {Trans, i18nMark, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
// import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import JOBS from 'data/JOBS'
import {ROYAL_ROAD_STATES, HELD_ARCANA, DRAWN_ARCANA} from './ArcanaGroups'
import Module from 'parser/core/Module'

import BuffList from './BuffList'
import styles from './BuffExtensions.module.css'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const IGNORE_STATUSES = [
	STATUSES.PROTECT.id,
	STATUSES.COLLECTIVE_UNCONSCIOUS.id,
	STATUSES.COLLECTIVE_UNCONSCIOUS_EFFECT.id,
	...ROYAL_ROAD_STATES,
	...HELD_ARCANA,
	...DRAWN_ARCANA,
]

const PULSE_THRESHOLD = 200
const CELESTIAL_OPPOSITION_LEAD_TIME = 1500
const STATUS_BUFFER_TIME = 1000
const STATUS_MIN_ACTIVE_TIME = 0

// TODO: Make some inference on their CO and TD usage for the suggestions panel - Sushi
export default class BuffExtensions extends Module {
	static handle = 'buffextensions'
	static title = 'Buff Extensions'
	static i18n_id = i18nMark('ast.buff-extensions.title')
	static displayOrder = DISPLAY_ORDER.BUFF_EXTENSIONS
	static dependencies = [
		'combatants',
	]

	// Array of objects detailing each use of either Time Dilation or Celestial Opposition
	_dilationUses = []
	_oppositionEvent = null
	_oppositionTracking = false
	_missedLucidExtensions = 0

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: [ACTIONS.TIME_DILATION.id, ACTIONS.CELESTIAL_OPPOSITION.id],
		}

		this.addHook('cast', filter, this._onCast)
		this.addHook('refreshbuff', {by: 'player'}, this._onBuffRefresh)

		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionID = event.ability.guid

		if (actionID === ACTIONS.TIME_DILATION.id) {
			this._onDilation(event)
		}

		if (actionID === ACTIONS.CELESTIAL_OPPOSITION.id) {
			this._onOpposition(event)
		}
	}

	/**
	 * Grabs all the buffs the target has, packs it up with some info and add to _dilationUses
	 *
	 * @param {obj} log event of a Time Dilation cast
	 * @return {void} null
	 */
	_onDilation(event) {
		// TODO: prevent getEntity from returning null if target was a pet - Sushi
		// (Pets are stored under the player entities)
		const refreshedTarget = this.combatants.getEntity(event.targetID)

		if (!refreshedTarget) {
			return
		}

		this._dilationUses.push({
			event: event,
			targets: [{
				id: event.targetID,
				name: refreshedTarget.info.name,
				job: refreshedTarget.info.type,
				buffs: refreshedTarget.getStatuses(null, event.timestamp, STATUS_BUFFER_TIME, STATUS_MIN_ACTIVE_TIME, event.sourceID).filter(status =>
					!IGNORE_STATUSES.includes(status.ability.guid)
				),
			}],
		})
	}

	/**
	 * Prepares an object to be populated by refresh events
	 *
	 * @param {obj} log event of a Celestial Opposition cast
	 * @return {void} null
	 */
	_onOpposition(event) {
		// Structure a new collection of refreshed buffs by this Opposition cast
		this._oppositionEvent = {
			event: event,
			targets: [],
		}

		this._oppositionTracking = true
	}

	_endOppositionChain() {
		if (this._oppositionEvent) {

			this._dilationUses.push({...this._oppositionEvent})
			this._oppositionTracking = false
			this._oppositionEvent = null
		}
	}

	/**
	 * Checks if the timestamp is within allowable range from the Opposition Event
	 * Populates the _oppositionEvent created in _onOpposition with refresh events on friendlies
	 *
	 * @param {obj} log event of a Celestial Opposition cast
	 * @return {void} null
	 */
	_onBuffRefresh(event) {
		// const statusID = event.ability.guid

		if (!this._oppositionTracking) {
			return
		}

		// Ignore if timestamp is not part of the refresh event chains
		// CO also seems to have at least 1200ms lead time from when the cast log is marked to the first refresh on self (oGCD things?)
		if (event.timestamp > (this._oppositionEvent.event.timestamp + CELESTIAL_OPPOSITION_LEAD_TIME + (PULSE_THRESHOLD * this._oppositionEvent.targets.length))) {

			this._endOppositionChain()
			return
		}

		const refreshedTarget = this.combatants.getEntity(event.targetID)

		// If this target isn't in the target array, add it
		if (!this._oppositionEvent.targets.find(target => target.id === event.targetID)) {

			// TODO: Doesn't work with pets - Sushi
			if (refreshedTarget) {
				this._oppositionEvent.targets.push({
					id: event.targetID,
					name: refreshedTarget.info.name,
					job: refreshedTarget.info.type,
					buffs: refreshedTarget.getStatuses(null, event.timestamp, CELESTIAL_OPPOSITION_LEAD_TIME, STATUS_MIN_ACTIVE_TIME, event.sourceID).filter(status =>
						!IGNORE_STATUSES.includes(status.ability.guid)
					),
				})
			}
		}
	}

	_onComplete() {
		// clean up trailing opposition events
		this._endOppositionChain()

		// Sorting chronologically
		this._dilationUses.sort((a, b) => {
			return a.event.timestamp - b.event.timestamp
		})

		// console.log(this._dilationUses)
		// iteration through dilation data
		for (const dilation of this._dilationUses) {
			// const actionID = dilation.event.ability.guid
			for (const target of dilation.targets) {
				// Sort the buffs so they're consistent
				target.buffs.sort((a, b) => {
					return a.ability.guid - b.ability.guid
				})

				// const isPlayer = target.id === this.parser.player.id

				// Checks if they didn't extend lucid
				// if (actionID === ACTIONS.CELESTIAL_OPPOSITION.id
				// 	&& isPlayer
				// 	&& !target.buffs.find(buff => buff.ability.guid === STATUSES.LUCID_DREAMING.id)) {
				// 	this._missedLucidExtensions++
				// }
			}
		}

		// if (this._missedLucidExtensions > 0) {
		// 	this.suggestions.add(new Suggestion({
		// 		icon: ACTIONS.CELESTIAL_OPPOSITION.icon,
		// 		content: <Fragment>
		// 			Use <ActionLink {...ACTIONS.LUCID_DREAMING} /> together with <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} />. They share the
		// 			same cooldown and the extra MP regeneration vastly improves Astrologian MP management.
		// 		</Fragment>,
		// 		severity: SEVERITY.MEDIUM,
		// 		why: <Fragment>
		// 			{this._missedLucidExtensions} instances of not having an extended Lucid Dreaming status with Celestial Opposition
		// 		</Fragment>,
		// 	}))
		// }

	}

	output() {

		if (this._dilationUses.length === 0) {
			return <Fragment>
				<p>
					<span className="text-error"><Trans id="ast.buff-extensions.messages.no-casts">Zero casts recorded for <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} /> and <ActionLink {...ACTIONS.TIME_DILATION} />.</Trans></span>
				</p>
			</Fragment>
		}

		const panels = this._dilationUses.map(dilation => {
			let descriptionText = ''
			let noExtensions = false
			let targetRows = null

			const emptyMessage = <Trans id="ast.buff-extensions.messages.no-buffs">No buffs extended.</Trans>

			// Changes copy depnding on ability
			if (dilation.event.ability.guid === ACTIONS.TIME_DILATION.id) {
				const numBuffs = dilation.targets[0].buffs.length
				descriptionText = <Trans id="ast.buff-extensions.messages.buffs-extended"><Plural value={numBuffs} one="# buff" other="# buffs" /> extended</Trans>
				if (numBuffs < 1) {
					noExtensions = true
				}
			} else if (dilation.event.ability.guid === ACTIONS.CELESTIAL_OPPOSITION.id) {
				const numTargets = dilation.targets.length
				descriptionText = <Trans id="ast.buff-extensions.messages.targets-affected"><Plural value={numTargets} one="# target" other="# targets" /> affected</Trans>

				if (numTargets < 1) {
					noExtensions = true
				}
			}

			// Either output the list of targets or the empty message
			targetRows = dilation.targets.map(target => {
				return <tr key={target.id}>
					<td>
						<JobIcon
							job={JOBS[target.job]}
							className={styles.jobIcon}
						/>
					</td>
					<td>{target.name}</td>
					<td>
						<BuffList events={target.buffs}></BuffList>
						<span className="text-error">
							{noExtensions && emptyMessage}
						</span>
					</td>
				</tr>
			})

			return {
				key: 'container-' + dilation.event.timestamp,
				title: {
					key: 'title-' + dilation.event.timestamp,
					content: <Fragment>
						<div className={styles.headerItem}>
							{this.parser.formatTimestamp(dilation.event.timestamp)}&nbsp;-&nbsp;
						</div>
						<div className={styles.headerItem}><img
							key={dilation.event.timestamp}
							src={ACTIONS[dilation.event.ability.guid].icon}
							className={styles.dilationEventIcon}
							alt={dilation.event.ability.name}
						/>
						</div>
						<div className={styles.headerItem}>
								&nbsp;-&nbsp;{descriptionText}
						</div>
					</Fragment>,
				},
				content: {
					key: 'content-' + dilation.event.timestamp,
					content: <Fragment>
						<table className={styles.buffTable}>
							<tbody>
								{targetRows.length ? targetRows
									: <tr>
										{noExtensions && emptyMessage}
									</tr>}
							</tbody>
						</table>
					</Fragment>,
				},
			}
		})

		return <Fragment>
			<p>
				<Trans id="ast.buff-extensions.messages.explanation">
			This section displays a history of targets affected with <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} /> and <ActionLink {...ACTIONS.TIME_DILATION} />.
					<br/>
			* Excluded statuses: <ActionLink {...ACTIONS.PROTECT} />
				</Trans>
			</p>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}
}

