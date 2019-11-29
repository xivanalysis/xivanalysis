import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'

// Statuses applied before the pull won't have an apply(de)?buff event
// Fake buff applications so modules don't need to take it into account
export default class PrecastStatus extends Module {
	static handle = 'precastStatus'
	static dependencies = [
		// Forcing action to run first, cus we want to always splice in before it.
		'precastAction', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	_combatantStatuses = {}
	_combatantActions = []
	_statusesToSynth = []
	_actionsToSynth = []
	_startTime = this.parser.fight.start_time

	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const targetId = event.targetID

			const statusInfo = getDataBy(STATUSES, 'id', event.ability.guid)

			this._combatantStatuses[targetId] = this._combatantStatuses[targetId] || []

			if (event.type === 'applybuff' && !statusInfo.hasOwnProperty('stacksApplied')) {
				// If status applies stacks, check applybuffstack for applying full stacks before considering this the first application of this status
				this.markStatusAsTracked(statusInfo.id, targetId)
			}

			if (event.type === 'applybuffstack' && statusInfo.hasOwnProperty('stacksApplied')) {
				// Determine if this is applying fewer than the max stacks
				if (event.stack < statusInfo.stacksApplied) {
					// Synth the precast status event if this applied fewer than max stacks
					this.fabricateStatusEvent(event, statusInfo)
				}

				this.markStatusAsTracked(statusInfo.id, targetId)
			}

			if (['removebuff', 'removebuffstack', 'refreshbuff'].includes(event.type)) {
				// If it's already been applied, we don't have to worry about it
				if (this._combatantStatuses[targetId].includes(statusInfo.id)) {
					continue
				}

				this.fabricateStatusEvent(event, statusInfo)
				this.markStatusAsTracked(statusInfo.id, targetId)
			}
		}

		const synthesizedEvents = this._actionsToSynth.concat(this._statusesToSynth)
		return synthesizedEvents.concat(events)
	}

	fabricateStatusEvent(event, statusInfo) {
		// Fab an event and splice it in at the start of the fight
		this._statusesToSynth.push({
			// Can inherit most of the event data from the current one
			...event,
			// Override a few vals
			timestamp: this._startTime - 1,
			type: 'applybuff',
		})

		// Determine if this buff comes from a known action, fab a cast event
		const actionInfo = getDataBy(ACTIONS, 'statusesApplied', statusInfo)
		if (actionInfo && this._combatantActions.indexOf(actionInfo.id) === -1) {
			this.fabricateActionEvent(event, actionInfo)
		}
	}

	fabricateActionEvent(event, actionInfo) {
		this._actionsToSynth.push({
			...event,
			ability: {
				...event.ability,
				name: actionInfo.name,
				abilityIcon: actionInfo.icon.replace('https://xivapi.com/i', '').replace('/', '-'),
				guid: actionInfo.id,
			},
			timestamp: this._startTime - 2,
			type: 'cast',
		})

		this.markActionAsTracked(actionInfo.id)
	}

	markStatusAsTracked(statusId, targetId) {
		this._combatantStatuses[targetId].push(statusId)
	}

	markActionAsTracked(actionId) {
		this._combatantActions.push(actionId)
	}
}
