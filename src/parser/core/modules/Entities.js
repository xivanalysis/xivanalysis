import Module from 'parser/core/Module'

export default class Entities extends Module {
	constructor(...args) {
		super(...args)

		// Buffs
		this.addEventHook('applybuff', this.applyBuff)
		this.addEventHook('applydebuff', event => this.applyBuff(event, true))
		this.addEventHook('applybuffstack', this.updateBuffStack)
		this.addEventHook('applydebuffstack', event => this.updateBuffStack(event, true))
		this.addEventHook('removebuffstack', this.updateBuffStack)
		this.addEventHook('removedebuffstack', event => this.updateBuffStack(event, true))
		this.addEventHook('removebuff', this.removeBuff)
		this.addEventHook('removedebuff', event => this.removeBuff(event, true))
		this.addEventHook('refreshbuff', this.refreshBuff)
		this.addEventHook('refreshdebuff', event => this.refreshBuff(event, true))

		this.addEventHook('normaliseddamage', this.updateResources)
		this.addEventHook('normalisedheal', this.updateResources)
	}

	// -----
	// Logic
	// -----
	// Utility stuff
	getEntities() {
		throw new Error('Not implemented')
	}

	getEntity(/* actorId */) {
		throw new Error('Not implemented')
	}

	// Buff handlers
	getBuffEventEntity(event) {
		// Ignore buff events irrelevant to the parsed player
		if (!this.parser.byPlayer(event) && !this.parser.toPlayer(event)) {
			return null
		}

		// Only checking buff target
		return this.getEntity(event.targetID)
	}

	applyBuff(event, isDebuff) {
		const entity = this.getBuffEventEntity(event)
		if (!entity) {
			return
		}

		const buff = {
			...event,
			start: event.timestamp,
			lastRefreshed: event.timestamp,
			end: null,
			stackHistory: [{stacks: 1, timestamp: event.timestamp}],
			isDebuff,
		}

		// Fire an event for all buffs for completeness' sake
		buff.stacks = 1
		this.triggerChangeBuffStack(buff, event.timestamp, 0, 1)

		entity.buffs.push(buff)
	}

	updateBuffStack(event) {
		const entity = this.getBuffEventEntity(event)
		if (!entity) {
			return
		}

		const buff = entity.buffs.find(buff =>
			buff.ability.guid === event.ability.guid &&
			buff.end === null,
		)

		if (!buff) {
			// yoink lmao
			console.error('Buff stack updated while active buff wasn\'t known. Was this buff applied pre-combat? Maybe we should register the buff with start time as fight start when this happens, but it might also be a basic case of erroneous combatlog ordering.')
			return
		}

		const oldStacks = buff.stacks || 1
		buff.stacks = event.stack
		buff.stackHistory.push({stacks: event.stack, timestamp: event.timestamp})

		this.triggerChangeBuffStack(buff, event.timestamp, oldStacks, buff.stacks)
	}

	removeBuff(event, isDebuff) {
		const entity = this.getBuffEventEntity(event)
		if (!entity) {
			return
		}

		let buff = entity.buffs.find(buff =>
			buff.ability.guid === event.ability.guid &&
			buff.end === null,
		)

		// If there's no existing buff, fake one from the start of the fight
		if (!buff) {
			buff = this.synthesizeBuff(event, isDebuff)
			entity.buffs.push(buff)
		}

		// End the buff and trigger a final stack change
		buff.end = event.timestamp
		buff.stackHistory.push({stacks: 0, timestamp: event.timestamp})
		this.triggerChangeBuffStack(buff, event.timestamp, buff.stacks, 0)
	}

	refreshBuff(event, isDebuff) {
		const entity = this.getBuffEventEntity(event)
		if (!entity) {
			return
		}

		let buff = entity.buffs.find(buff => buff.ability.guid === event.ability.guid && buff.end == null)

		// If there's no existing buff, fake one from the start of the fight
		if (!buff) {
			buff = this.synthesizeBuff(event, isDebuff)
			entity.buffs.push(buff)
		}

		// Update the buff's last refreshed time
		const oldStacks = buff.stacks
		buff.lastRefreshed = event.timestamp
		buff.stacks = 1
		buff.stackHistory.push({stacks: 1, timestamp: event.timestamp})

		this.triggerChangeBuffStack(buff, event.timestamp, oldStacks, buff.stacks)
	}

	synthesizeBuff(event, isDebuff) {
		const startTime = this.parser.eventTimeOffset
		return {
			...event,
			start: startTime,
			end: null,
			stackHistory: [{stacks: 1, timestamp: startTime}],
			isDebuff,
		}
	}

	triggerChangeBuffStack(buff, timestamp, oldStacks, newStacks) {
		this.parser.fabricateEvent({
			...buff,
			type: buff.isDebuff? 'changedebuffstack' : 'changebuffstack',
			timestamp,
			oldStacks,
			newStacks,
			stacksGained: newStacks - oldStacks,
		}, buff)
	}

	updateResources(event) {
		// Try to update both source and target
		const source = this.getEntity(event.sourceID)
		if (source && event.sourceResources) {
			source.resources = event.sourceResources
		}

		const target = this.getEntity(event.targetID)
		if (target && event.targetResources) {
			target.resources = event.targetResources
		}
	}
}
