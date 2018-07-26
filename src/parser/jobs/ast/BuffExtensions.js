import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import JOBS from 'data/JOBS'
import {ROYAL_ROAD_STATES, HELD_ARCANA, DRAWN_ARCANA} from './ArcanaGroups'
import Module from 'parser/core/Module'


import JobIcon from 'components/ui/JobIcon'
import BuffList from './BuffList'

import styles from './BuffExtensions.module.css'


export default class BuffExtensions extends Module {
	static handle = 'buffdilation'
	static title = 'Buff Extensions'
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions',
	]

	// Lag allowance for applying aoe effects
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

	// Grabs all the buffs the target has, packs it up with some info and adds to _dilationUses
	_onDilation(event) {

		// TODO: prevent getEntity from returning null if target was a pet
		// (Pets are stored under the player entities)
		let refreshedTarget = this.parser.modules.combatants.getEntity(event.targetID)

		this._dilationUses.push({
			event: event,
			targetName: refreshedTarget.info.name,
			targetJob: refreshedTarget.info.type,
			buffs: refreshedTarget.getStatuses(event.timestamp, 0, 1000, event.sourceID),
		})
	}

	// Need to check for who exactly was in range of the buff, before using the same idea as in Time Dilation
	// Records the event and timestamp, then leaves the rest up to _onBuffRefresh
	_onOpposition(event) {

		// Clear previous Opposition history
		if (this._oppositionEvent) {
			this._dilationUses.push({...this._oppositionEvent})
			this._oppositionEvent = null
		}

		// Structure a new collection of refreshed buffs by this Opposition cast
		this._oppositionEvent = {
			event: event,
			targets: []
		}

	}

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


				let refreshedTarget = this.parser.modules.combatants.getEntity(event.targetID)

				// If this target isn't in the target array, add it
				if(!this._oppositionEvent.targets.find(target => {
					return target.id === event.targetID
				})){


					// TODO: Doesn't work with pets
					if(refreshedTarget){
						this._oppositionEvent.targets.push({
							id: event.targetID,
							name: refreshedTarget.info.name,
							job: refreshedTarget.info.type,
							buffs: [event]
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

		this._dilationUses.sort((a, b) => {
			return a.event.timestamp - b.event.timestamp
		})



	}

	output() {
		const panels = this._dilationUses.map(dilation => {

			if (dilation.event.ability.guid === ACTIONS.TIME_DILATION.id) {
				// Output for Time Dilation
				const numBuffs = dilation.buffs.length

				return {
					title: {
						key: 'title-' + dilation.event.timestamp,
						content: <Fragment>
							<div className={styles.buffSetHeaderItem}>
								{this.parser.formatTimestamp(dilation.event.timestamp)}&nbsp;-&nbsp;
							</div>
							<div className={styles.buffSetHeaderItem}><img
									key={dilation.event.timestamp}
									src={ACTIONS[dilation.event.ability.guid].icon}
									className={styles.dilationEventIcon}
									alt={dilation.event.ability.name}
								/>
							</div>
							<div className={styles.buffSetHeaderItem}>
								{numBuffs} buffs extended.
							</div>
							<div className={styles.buffSetHeaderItemRight}>
								<span>{dilation.targetName}</span>
								<JobIcon
									job={JOBS[dilation.targetJob]}
									className={styles.jobIcon}
								/>
							</div>

						</Fragment>,
					},
					content: {
						key: 'content-' + dilation.event.timestamp,
						content: <BuffList events={dilation.buffs}/>,
					},
				}
			} else if (dilation.event.ability.guid === ACTIONS.CELESTIAL_OPPOSITION.id) {
				// Output for Celestial Opposition
				const numTargets = dilation.targets.length

				return {
					title: {
						key: 'title-' + dilation.event.timestamp,
						content: <Fragment>
							<div className={styles.buffSetHeaderItem}>
								{this.parser.formatTimestamp(dilation.event.timestamp)}&nbsp;-&nbsp;
							</div>
							<div className={styles.buffSetHeaderItem}><img
									key={dilation.event.timestamp}
									src={ACTIONS[dilation.event.ability.guid].icon}
									className={styles.dilationEventIcon}
									alt={dilation.event.ability.name}
								/>
							</div>
							<div className={styles.buffSetHeaderItem}>
								{numTargets} targets affected.
							</div>

						</Fragment>,
					},
					content: {
						key: 'content-' + dilation.event.timestamp,
						content: <div>{ dilation.targets.map(target => {
							return <Fragment>
								<table>
									<tbody>
										<tr>
											<td>
												<JobIcon
													job={JOBS[target.job]}
													className={styles.jobIcon}
												/>
											</td>
											<td>{target.name}</td>
												<BuffList events={target.buffs}></BuffList>
											<td></td>
										</tr>
									</tbody>
								</table>
							</Fragment>
						}
						)}</div>,
					}

				}

			} else {
				return
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

