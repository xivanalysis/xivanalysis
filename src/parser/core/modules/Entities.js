import Module from 'parser/core/Module'

const APPLY = 'apply'
const REMOVE = 'remove'

export default class Entities extends Module {
	static dependencies = [
		'invuln',
		'fflogsEvents',
	]

	// -----
	// API
	// -----
	// TODO: This implementation which I've shamelessly stolen seems to only track overall
	//       uptime, ignoring potential gains from multidotting, etc. Should that be in here,
	//       or is that a somewhere-else sort of thing...
	getStatusUptime(statusId, sourceId = this.parser.player.id) {
		const events = []

		// Build up the events array
		const entities = this.getEntities()
		Object.values(entities).forEach(entity => {
			const invulns = this.invuln
				.getInvulns(entity.id)
				.filter(invuln => invuln.type === 'invulnerable')

			entity.buffs.forEach(buff => {
				if (
					buff.ability.guid !== statusId ||
					(buff.sourceID !== sourceId && buff.sourceID !== null)
				) {
					return
				}

				// Split the buff over the invulns
				const ranges = [buff]
				invulns.forEach(invuln => {
					// discard invulns outside the span of the buff
					if (invuln.end < buff.start || invuln.start > buff.end) {
						return
					}

					// split ranges
					for (let i = 0; i < ranges.length; i++) {
						const range = ranges[i]

						if (invuln.start < range.start && invuln.end > range.start) {
							// Invuln chops start of range
							range.start = invuln.end
						} else if (invuln.start < range.end && invuln.end > range.end) {
							// Invuln chops end of range
							range.end = invuln.start
						}	else if (invuln.start > range.start && invuln.end < range.end) {
							// Invuln splits the range
							ranges.splice(i, 1,
								{start: range.start, end: invuln.start},
								{start: invuln.end, end: range.end}
							)
						}
					}
				})

				// Add faked events for all the ranges the buff was up
				ranges.forEach(range => {
					events.push({
						timestamp: range.start,
						type: APPLY,
						buff,
					})
					events.push({
						timestamp: range.end || this.parser.currentTimestamp,
						type: REMOVE,
						buff,
					})
				})
			})
		})

		// Reduce the events array into a final uptime
		let active = 0
		let start = null
		return events
			.sort((a, b) => a.timestamp - b.timestamp)
			.reduce((uptime, event) => {
				if (event.type === APPLY) {
					if (active === 0) {
						start = event.timestamp
					}
					active ++
				}
				if (event.type === REMOVE) {
					active --
					if (active === 0) {
						uptime += event.timestamp - start
					}
				}
				return uptime
			}, 0)
	}

	// -----
	// Event handlers
	// -----
	constructor(...args) {
		super(...args)

		// Buffs
		this.addHook('applybuff', this.applyBuff)
		this.addHook('applydebuff', event => this.applyBuff(event, true))
		this.addHook('applybuffstack', this.updateBuffStack)
		this.addHook('applydebuffstack', event => this.updateBuffStack(event, true))
		this.addHook('removebuffstack', this.updateBuffStack)
		this.addHook('removedebuffstack', event => this.updateBuffStack(event, true))
		this.addHook('removebuff', this.removeBuff)
		this.addHook('removedebuff', event => this.removeBuff(event, true))

		// Resources - hooked to init to make sure normaliser runs to determine damage event before hooking events
		this.addHook('init', () => {
			this.addHook(this.fflogsEvents.damageEventName, this.updateResources)
			this.addHook(this.fflogsEvents.healEventName, this.updateResources)
		})
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
			buff.end === null
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
			buff.end === null
		)

		// If there's no existing buff, fake one from the start of the fight
		if (!buff) {
			const startTime = this.parser.fight.start_time
			buff = {
				...event,
				start: startTime,
				end: null,
				stackHistory: [{stacks: 1, timestamp: startTime}],
				isDebuff,
			}
			entity.buffs.push(buff)
		}

		// End the buff and trigger a final stack change
		buff.end = event.timestamp
		buff.stackHistory.push({stacks: 0, timestamp: event.timestamp})
		this.triggerChangeBuffStack(buff, event.timestamp, buff.stacks, 0)
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
