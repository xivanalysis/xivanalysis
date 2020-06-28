import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import _ from 'lodash'

// Statuses applied before the pull won't have an apply(de)?buff event
// Fake buff applications so modules don't need to take it into account
export default class PrecastStatus extends Module {
	static handle = 'precastStatus'
	static dependencies = [
		// Forcing action to run first, cus we want to always splice in before it.
		'precastAction', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'data',
	]
	static debug = false

	_combatantStatuses = {}
	_combatantActions = []
	_statusesToSynth = []
	_actionsToSynth = []
	_startTime = this.parser.eventTimeOffset

	normalise(events) {
		for (let i = 0; i < events.length; i++) {
			const event = events[i]
			const targetId = event.targetID

			const statusInfo = this.data.getStatus(event.ability?.guid)
			if (!statusInfo) {
				// No valid status data, skip to next event
				continue
			}

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

		return [...this._actionsToSynth, ...this._statusesToSynth, ...events]
	}

	fabricateStatusEvent(event, statusInfo) {
		this.debug(`Fabricating applybuff event for status ${statusInfo.name}`)
		// Fab an event and splice it in at the start of the fight
		this._statusesToSynth.push({
			// Can inherit most of the event data from the current one
			...event,
			// Override a few vals
			timestamp: this._startTime - 1,
			type: 'applybuff',
		})

		if (statusInfo.stacksApplied > 0) {
			this.debug(`Fabricating applybuff event for status ${statusInfo.name} with ${statusInfo.stacksApplied} stacks`)
			// Status applies multiple stacks - fab an applybuffstack event
			this._statusesToSynth.push({
				// Can inherit most of the event data from the current one
				...event,
				// Override a few vals
				timestamp: this._startTime - 1,
				type: 'applybuffstack',
				stack: statusInfo.stacksApplied,
			})
		}

		// Determine if this buff comes from a known action, fab a cast event
		const statusKey = _.findKey(this.data.statuses, statusInfo)
		const actionInfo = getDataBy(this.data.actions, 'statusesApplied', statusKey)
		if (actionInfo && this._combatantActions.indexOf(actionInfo.id) === -1) {
			this.fabricateActionEvent(event, actionInfo)
		}
	}

	fabricateActionEvent(event, actionInfo) {
		this.debug(`Fabricating cast event for action ${actionInfo.name} by ${event.sourceID}`)
		const fabricated = {
			...event,
			ability: {
				...event.ability,
				name: actionInfo.name,
				abilityIcon: actionInfo.icon.replace('https://xivapi.com/i', '').replace('/', '-'),
				guid: actionInfo.id,
			},
			timestamp: this._startTime - 2,
			type: 'cast',
		}
		this._actionsToSynth.push(fabricated)

		this.markActionAsTracked(actionInfo.id)
	}

	markStatusAsTracked(statusId, targetId) {
		this._combatantStatuses[targetId].push(statusId)
	}

	markActionAsTracked(actionId) {
		this._combatantActions.push(actionId)
	}
}
