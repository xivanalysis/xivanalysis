import _ from 'lodash'
import Module from 'parser/core/Module'
import {ItemGroup, Item} from 'parser/core/modules/Timeline'
import React from 'react'
// import {RAID_BUFFS} from 'parser/core/modules/RaidBuffs'
import ACTIONS from 'data/ACTIONS'
import {ActorType} from 'fflogs'

// // These will be in a different module if at all
// // Buffs
// RAID_BUFFS

// // Debuffs
// RAID_DEBUFFS = [
// 	{key: 'ADDLE'},
// 	{key: 'REPRISAL'},
// ]

// KC: This should only care about the CDs, not the buff / debuf durations
// KC: Should SELF be the only group we really implement in this module?
// KC: Better idea is:
// for each job, they have:
// 		RAID BUFFS - for offensive group buffs / enemy debuffs
// 		RAID DEF - group defensive group buffs / enemy debuffs
// 		SELF - personal cooldowns
// Then each SourceID / Action ID pair would map to a group
// 		RAID BUFFS - map to a shared group for the given action ID
// 		RAID DEF - map to a shared group for the given action ID buff duration
// 				 - Also shows up for the personal subgroup as a CD
// 		SELF - Buffs are top level ? out of scope
// 		     - CDs are subgrouped

// KC: One for roles too? or just mix it in
export const JOB_COOLDOWNS = {
	[ActorType.PALADIN]: {
		actions: [
			// Global
			ACTIONS.REPRISAL.id,
			ACTIONS.DIVINE_VEIL.id,
			ACTIONS.PASSAGE_OF_ARMS.id,
			// Personal
			ACTIONS.SENTINEL.id,
			ACTIONS.RAMPART.id,
			ACTIONS.COVER.id, // other
			ACTIONS.INTERVENTION.id, // other
			ACTIONS.SHELTRON.id, // useful?
			ACTIONS.HALLOWED_GROUND.id,
		],
	},
	[ActorType.WARRIOR]: {
		actions: [
			// Global
			ACTIONS.SHAKE_IT_OFF.id,
			ACTIONS.REPRISAL.id,
			// Personal
			ACTIONS.RAW_INTUITION.id,
			ACTIONS.NASCENT_FLASH.id,
			ACTIONS.VENGEANCE.id,
			ACTIONS.THRILL_OF_BATTLE.id,
			ACTIONS.EQUILIBRIUM.id,
			ACTIONS.RAMPART.id,
			ACTIONS.HOLMGANG.id,
		],
	},
	[ActorType.DARK_KNIGHT]: {
		actions: [
			// Global
			ACTIONS.DARK_MISSIONARY.id,
			ACTIONS.REPRISAL.id,
			// Personal
			ACTIONS.THE_BLACKEST_NIGHT.id,
			ACTIONS.SHADOW_WALL.id,
			ACTIONS.DARK_MIND.id,
			ACTIONS.RAMPART.id,
			ACTIONS.LIVING_DEAD.id,
		],
	},
	[ActorType.GUNBREAKER]: {
		actions: [
			// Global
			ACTIONS.HEART_OF_LIGHT.id,
			ACTIONS.REPRISAL.id,
			// Personal
			ACTIONS.CAMOUFLAGE.id,
			ACTIONS.NEBULA.id,
			ACTIONS.HEART_OF_STONE.id,
			ACTIONS.RAMPART.id,
			ACTIONS.SUPERBOLIDE.id,
		],
	},
	[ActorType.WHITE_MAGE]: {
		actions: [
			// Global
			ACTIONS.TEMPERANCE.id,
			ACTIONS.ASYLUM.id,
			ACTIONS.PLENARY_INDULGENCE.id,
		],
	},
	[ActorType.SCHOLAR]: {
		actions: [
			// Global
			ACTIONS.SACRED_SOIL.id,
			ACTIONS.SCH_FEY_ILLUMINATION.id,
			ACTIONS.FEY_ILLUMINATION.id,
			ACTIONS.SERAPHIC_ILLUMINATION.id,
		],
	},
	[ActorType.ASTROLOGIAN]: {
		actions: [
			// Global
			ACTIONS.COLLECTIVE_UNCONSCIOUS.id,
			ACTIONS.EARTHLY_STAR.id,
		],
	},
	[ActorType.MONK]: {
		actions: [
			// Global
			ACTIONS.MANTRA.id,
			ACTIONS.FEINT.id,
			// Personal
			ACTIONS.SECOND_WIND.id,
		],
	},
	[ActorType.DRAGOON]: {
		actions: [
			// Global
			ACTIONS.FEINT.id,
			// Personal
			ACTIONS.SECOND_WIND.id,
		],
	},
	[ActorType.NINJA]: {
		actions: [
			// Global
			ACTIONS.FEINT.id,
			// Personal
			ACTIONS.SECOND_WIND.id,
		],
	},
	[ActorType.SAMURAI]: {
		actions: [
			// Global
			ACTIONS.FEINT.id,
			// Personal
			ACTIONS.SECOND_WIND.id,
		],
	},
	[ActorType.BARD]: {
		actions: [
			// Global
			ACTIONS.TROUBADOUR.id,
			// Personal
			ACTIONS.THE_WARDENS_PAEAN.id,
			ACTIONS.SECOND_WIND.id,
		],
	},
	[ActorType.MACHINIST]: {
		actions: [
			// Global
			ACTIONS.TACTICIAN.id,
			// Personal
			ACTIONS.SECOND_WIND.id,
		],
	},
	[ActorType.DANCER]: {
		actions: [
			// Global
			ACTIONS.SHIELD_SAMBA.id,
			ACTIONS.IMPROVISATION.id,

		],
	},
	[ActorType.BLACK_MAGE]: {
		actions: [
			// Global
			ACTIONS.ADDLE.id,
		],
	},
	[ActorType.SUMMONER]: {
		actions: [
			// Global
			ACTIONS.ADDLE.id,
		],
	},
	[ActorType.RED_MAGE]: {
		actions: [
			// Global
			ACTIONS.ADDLE.id,
		],
	},
}

// Track the cooldowns on actions and shit for the whole party
// KC: Need to do stuff for this to become a TS file
export default class PartyCooldowns extends Module {
	static handle = 'partyCooldowns'
	static dependencies = [
		'data',
		'timeline',
		'additionalPartyEvents', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'friendlies',
	]

	// Array used to sort cooldowns in the timeline. Elements should be either IDs for
	// top-level groups, or objects of the format {name: string, actions: array} for
	// nested groups. Actions not specified here will be sorted by their ID below.
	// Check the NIN and SMN modules for examples.

	_cooldownGroups = {}

	_currentActionMap = {}
	_cooldowns = {}
	_groups = {}

	constructor(...args) {
		super(...args)
		console.log(args)
		console.log(this.friendlies.playerFriendlies.map(friendly => friendly.name))
		console.log(this.friendlies.playerFriendlies)

		// KC:
		// for each friendly
		//   this.friendlies.playerFriendlies
		// Figure out their job / role
		//   this.friendlies.playerFriendlies.map(player => player.role)
		// make a group for them
		//   this.friendlies.playerFriendlies.map(player => player.id) == SourceId
		// add shared stuff to the shared groups
		// add common stuff to the common groups
		const playerFriendlies = this.friendlies.playerFriendlies
		this._buildPlayerGroups(playerFriendlies, JOB_COOLDOWNS)
		// TODO: Get buffs to show up as top level merge for player

		this._cooldownGroups = _.groupBy(this.data.actions, 'cooldownGroup')

		// Pre-build groups for actions explicitly set by subclasses
		// KC: phasing this function out
		// this._buildGroups(this.constructor.cooldownOrder)

		// KC: Duplicate work with AdditionalPartyEvents
		// KC: This will break when JOB_COOLDOWNS becomes more complicated
		const playerActions = playerFriendlies.flatMap(player => (
			JOB_COOLDOWNS[player.type].actions
		))
		const filter = {abilityId: playerActions}

		this.addHook('begincast', filter, this._onBeginCast)
		this.addHook('cast', filter, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_sourceActionId(sourceId, actionId) {
		return `${sourceId}-${actionId}`
	}

	_buildPlayerGroups(players, jobCooldowns) {
		if (!players) { return }

		const ids = players.map((player, i) => {
			const playerOrder = -(players.length - i)
			const playerGroup = this._buildGroup({
				id: player.id,
				content: player.name,
				order: playerOrder,
			})
			const playerJobCooldowns = jobCooldowns[player.type]

			playerGroup.nestedGroups = playerJobCooldowns.actions.map((data, i) => {
				const order = -(playerJobCooldowns.actions.length - i)
				// KC: Check if this should be personal or grouped
				if (typeof data === 'number') {
					const action = this.data.getAction(data)
					const combinedId = this._sourceActionId(player.id, data)
					this._buildGroup({
						id: combinedId,
						content: action && action.name,
						order,
					})
					return combinedId
				}
			})
		})

		return ids
	}

	// _buildGroups(groups) {
	// 	// If there's no groups, noop
	// 	if (!groups) { return }

	// 	const ids = groups.map((data, i) => {
	// 		const order = -(groups.length - i)

	// 		// If it's just an action id, build a group for it and stop
	// 		if (typeof data === 'number') {
	// 			const action = this.data.getAction(data)
	// 			this._buildGroup({
	// 				id: data,
	// 				content: action && action.name,
	// 				order,
	// 			})
	// 			return data
	// 		}

	// 		// Build the base group
	// 		const group = this._buildGroup({
	// 			id: data.name,
	// 			content: data.name,
	// 			order,
	// 		})

	// 		if (data.merge) {
	// 			// If it's a merge group, we only need to register our group for each of the IDs
	// 			data.actions.forEach(id => {
	// 				this._groups[id] = group
	// 			})
	// 		} else {
	// 			// Otherwise, build nested groups for each action
	// 			group.nestedGroups = this._buildGroups(data.actions)
	// 		}

	// 		return data.name
	// 	})

	// 	return ids
	// }

	_buildGroup(opts) {
		const group = new ItemGroup({visible: true, showNested: true, ...opts})
		this.timeline.addGroup(group)
		this._groups[opts.id] = group
		return group
	}

	// cooldown starts at the beginning of the casttime
	// (though 99% of CD based abilities have no cast time)
	// TODO: Should I be tracking pet CDs too? I mean, contagion/radiant are a thing.
	_onBeginCast(event) {
		const action = this.data.getAction(event.ability.guid)
		if (!action || action.cooldown == null) { return }

		const sourceID = event.sourceID

		this._currentActionMap[sourceID] = action

		this.startCooldown(sourceID, action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(sourceID, action.id, action.cooldownGroup)
		}
	}

	_onCast(event) {
		const action = this.data.getAction(event.ability.guid)

		if (!action || action.cooldown == null) { return }
		const sourceID = event.sourceID

		const finishingCast = this._currentActionMap[sourceID] && this._currentActionMap[sourceID].id === action.id
		this._currentActionMap[sourceID] = null

		if (finishingCast) { return }

		this.startCooldown(sourceID, action.id)
		if (!_.isNil(action.cooldownGroup)) {
			this.startCooldownGroup(sourceID, action.id, action.cooldownGroup)
		}
	}

	_onComplete() {
		Object.entries(this._cooldowns).forEach(([sourceId, cooldowns]) => {
			Object.keys(cooldowns).forEach(actionId => {
				this._addToTimeline(sourceId, parseInt(actionId, 10))
			})
		})
		// Object.keys(this._cooldowns).forEach(actionId => {
		// 	this._addToTimeline(parseInt(sourceId, actionId, 10))
		// })
	}

	_addToTimeline(sourceId, actionId) {
		const cd = this._cooldowns[sourceId][actionId]
		if (!cd) {
			return false
		}

		// Clean out any 'current' cooldowns into the history
		if (cd.current) {
			cd.history.push(cd.current)
			cd.current = null
		}

		const action = this.data.getAction(actionId)

		// If the action is on the GCD, GlobalCooldown will be managing its own group
		if (!action || action.onGcd) {
			return false
		}

		// Ensure we've got a group for this item
		const groupKey = this._sourceActionId(sourceId, actionId)
		if (!this._groups[groupKey]) {
			// KC: Make a group for the source?
			this._buildGroup({
				id: groupKey,
				content: action.name,
				order: actionId,
			})
		}

		// Add CD info to the timeline
		cd.history
			.forEach(use => {
				if (!use.shared) {
					this._groups[groupKey].addItem(new Item({
						type: 'background',
						start: use.timestamp - this.parser.fight.start_time,
						length: use.length,
						content: <img src={action.icon} alt={action.name} />,
					}))
				}
			})

		return true
	}

	getCooldown(sourceId, actionId) {
		const sourceCooldowns = this._cooldowns[sourceId] || {}
		return sourceCooldowns[actionId] || {
			current: null,
			history: [],
		}
	}

	startCooldownGroup(sourceId, originActionId, cooldownGroup) {
		const sharedCooldownActions = _.get(this._cooldownGroups, cooldownGroup, [])
		sharedCooldownActions
			.map(action => action.id)
			.filter(id => id !== originActionId)
			.forEach(id => this.startCooldown(sourceId, id, true))
	}

	startCooldown(sourceId, actionId, sharedCooldown = false) {
		// TODO: handle shared CDs
		const action = this.data.getAction(actionId)
		if (!action) { return }

		// Get the current cooldown status, falling back to a new cooldown
		const cd = this.getCooldown(sourceId, actionId)

		// If there's a current object, move it into the history
		// TODO: handle errors on CD overlap
		if (cd.current) {
			const currentFightDuration = this.parser.currentTimestamp - this.parser.fight.start_time
			if (cd.current.timestamp < this.parser.fight.start_time && cd.current.length > currentFightDuration) {
				// Pre-pull usage, reset the cooldown to prevent overlap on timeline since we don't know exactly when cooldown was used pre-pull
				this.resetCooldown(sourceId, actionId)
			} else {
				cd.history.push(cd.current)
			}
		}

		cd.current = {
			timestamp: this.parser.currentTimestamp,
			length: action.cooldown * 1000, // CDs are in S, timestamps are in MS
			shared: sharedCooldown,
			invulnTime: 0,
		}

		// Save the info back out (to ensure propagation if we've got a new info)
		if (_.isNil(this._cooldowns[sourceId])) {
			this._cooldowns[sourceId] = {}
		}
		this._cooldowns[sourceId][actionId] = cd
	}

	reduceCooldown(sourceId, actionId, reduction) {
		const cd = this.getCooldown(sourceId, actionId)
		const currentTimestamp = this.parser.currentTimestamp

		// Check if current isn't current
		if (cd.current && cd.current.timestamp + cd.current.length < currentTimestamp) {
			cd.history.push(cd.current)
			cd.current = null
		}

		// TODO: Do I need to warn if they're reducing cooldown on something _with_ no cooldown?
		if (cd.current === null) {
			return
		}

		// Reduce the CD
		cd.current.length -= reduction * 1000

		// If the reduction would have made it come off CD earlier than now, reset it - the extra time reduction should be lost.
		if (cd.current.timestamp + cd.current.length < currentTimestamp) {
			this.resetCooldown(sourceId, actionId)
		}
	}

	resetCooldown(sourceId, actionId) {
		const cd = this.getCooldown(sourceId, actionId)

		// If there's nothing running, we can just stop
		// TODO: need to warn?
		if (cd.current === null) {
			return
		}

		// Fix up the length
		cd.current.length = this.parser.currentTimestamp - cd.current.timestamp

		// Move the CD into the history
		cd.history.push(cd.current)
		cd.current = null
	}

	getCooldownRemaining(sourceId, actionId) {
		const current = this.getCooldown(sourceId, actionId).current
		if (!current) {
			return 0
		}

		return current.length - (this.parser.currentTimestamp - current.timestamp)
	}

	// TODO: Should this be here?
	getTimeOnCooldown(sourceId, actionId, extension = 0) {
		const cd = this.getCooldown(sourceId, actionId)
		const currentTimestamp = this.parser.currentTimestamp

		cd.history.map(cooldown => {
			cooldown.invulnTime = 0
		})

		return cd.history.reduce(
			(time, status) => time + this.getAdjustedTimeOnCooldown(status, currentTimestamp, extension),
			cd.current ? this.getAdjustedTimeOnCooldown(cd.current, currentTimestamp, extension) : 0,
		)
	}

	getAdjustedTimeOnCooldown(cooldown, currentTimestamp, extension) {
		// Doesn't count time on CD outside the bounds of the current fight, it'll throw calcs off
		// Add to the length of the cooldown any invuln time for the boss
		// Additionally account for any extension the caller allowed to the CD Length
		const duration = currentTimestamp - cooldown.timestamp
		const maximumDuration = cooldown.length + cooldown.invulnTime + extension
		return _.clamp(duration, 0, maximumDuration)
	}

	get used() {
		return Object.values.flatmap(cooldowns => Object.keys(cooldowns))
		// return Object.keys(this._cooldowns[sourceId])
	}
}
