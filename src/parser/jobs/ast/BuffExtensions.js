import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import JobIcon from 'components/ui/JobIcon'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import JOBS from 'data/JOBS'
import {ROYAL_ROAD_STATES, HELD_ARCANA, DRAWN_ARCANA} from './ArcanaGroups'
import Module from 'parser/core/Module'


import BuffList from './BuffList'
import styles from './BuffExtensions.module.css'

// TODO: Make some inference on their CO and TD usage for the suggestions panel - Sushi
export default class BuffExtensions extends Module {
	static handle = 'buffextensions'
	static title = 'Buff Extensions'
	static dependencies = [
		'suggestions',
	]

	// Latency allowance for applying aoe effects
	_envEffectGracePeriod = 4500
	// Array of objects detailing each use of either Time Dilation or Celestial Opposition
	_dilationUses = []
	_oppositionEvent = null


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
		const refreshedTarget = this.parser.modules.combatants.getEntity(event.targetID)

		this._dilationUses.push({
			event: event,
			targets: [{
				id: event.targetID,
				name: refreshedTarget.info.name,
				job: refreshedTarget.info.type,
				buffs: refreshedTarget.getStatuses(event.timestamp, 0, 1000, event.sourceID),
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

		// Clear previous Opposition history
		if (this._oppositionEvent) {
			this._dilationUses.push({...this._oppositionEvent})
			this._oppositionEvent = null
		}

		// Structure a new collection of refreshed buffs by this Opposition cast
		this._oppositionEvent = {
			event: event,
			targets: [],
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
		const statusID = event.ability.guid

		// Ignore if timestamp is after aoe effect grace period
		if (this._oppositionEvent && event.timestamp < (this._oppositionEvent.event.timestamp + this._envEffectGracePeriod)) {

			// Ignore refreshes on protects, royal road statuses,
			if (statusID !== STATUSES.PROTECT.id
			&& statusID !== STATUSES.COLLECTIVE_UNCONSCIOUS.id
			&& !ROYAL_ROAD_STATES.includes(statusID)
			&& !HELD_ARCANA.includes(statusID)
			&& !DRAWN_ARCANA.includes(statusID)) {


				const refreshedTarget = this.parser.modules.combatants.getEntity(event.targetID)

				// If this target isn't in the target array, add it
				if (!this._oppositionEvent.targets.find(target => {
					return target.id === event.targetID
				})) {


					// TODO: Doesn't work with pets - Sushi
					if (refreshedTarget) {
						this._oppositionEvent.targets.push({
							id: event.targetID,
							name: refreshedTarget.info.name,
							job: refreshedTarget.info.type,
							buffs: [event],
						})
					}
				} else {
					this._oppositionEvent.targets.find(target => {
						return target.id === event.targetID
					}).buffs.push({...event})
				}
			}
		}
	}

	_onComplete() {

		// clean up trailing opposition events
		if (this._oppositionEvent) {
			this._dilationUses.push({...this._oppositionEvent})
			this._oppositionEvent = null
		}

		// Sorting chronologically
		this._dilationUses.sort((a, b) => {
			return a.event.timestamp - b.event.timestamp
		})

		// Sort the buffs so they're consistent
		for (const dilation of this._dilationUses) {
			for (const target of dilation.targets) {
				target.buffs.sort((a, b) => {
					return a.ability.guid - b.ability.guid
				})
			}
		}



	}

	output() {
		const panels = this._dilationUses.map(dilation => {

			let descriptionText = ''
			let emptyMessage = null
			let targetRows = null


			// Changes copy depnding on ability
			if (dilation.event.ability.guid === ACTIONS.TIME_DILATION.id) {
				const numBuffs = dilation.targets[0].buffs.length
				descriptionText = numBuffs + ' buffs extended'
				if (numBuffs < 1) {
					emptyMessage = 'No buffs extended.'
				}
			} else if (dilation.event.ability.guid === ACTIONS.CELESTIAL_OPPOSITION.id) {
				const numTargets = dilation.targets.length
				descriptionText = numTargets + ' targets affected'

				if (numTargets < 1) {
					emptyMessage = 'No buffs extended.'
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
						<span className="text-error">{emptyMessage}</span>
					</td>
				</tr>
			})



			return {
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
										{emptyMessage}
									</tr>}
							</tbody>
						</table>
					</Fragment>,
				},

			}



		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}

