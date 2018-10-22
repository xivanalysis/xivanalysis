import React, {Fragment} from 'react'
import {Trans, Plural, i18nMark} from '@lingui/react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {BLM_GAUGE_EVENT} from './Gauge'
import DISPLAY_ORDER from './DISPLAY_ORDER'


const OGCDS = [
ACTIONS.TRIPLECAST.id,
ACTIONS.LEY_LINES.id,
ACTIONS.CONVERT.id,
ACTIONS.SWIFTCAST.id,
]


export default class Reopeners extends Module {
	static handle = 'Reopeners'
	static i18n_id = i18nMark('blm.reopeners.title')
	static title = 'Reopener issues'
	static displayOrder = DISPLAY_ORDER.REOPENERS

	static dependencies = [
		'suggestions',
		'gauge', // eslint-disable-line xivanalysis/no-unused-dependencies
		'invuln',
		'cooldowns',
		'combatants',
	]

	//check for buffs
	_umbralHeartStacks = 0
	_astralFireStacks = 0
	_umbralIceStacks = 0
	_MP = 0
	_ogcds = {}
	_gaugeState = {}
	//reopener tracking
	_rotation = {}
	_history = []
	//suggestion counters
	_startInAstralFire = 0
	_startWithBlizzardThree = 0

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('init', this._onFirst)
		this.addHook('complete', this._onComplete)
		this.addHook(BLM_GAUGE_EVENT, this._onGaugeChange)
	}

	_onGaugeChange(event) {
		this._gaugeState.astralFire = event.astralFire
		this._gaugeState.umbralIce = event.umbralIce
		this._gaugeState.umbralHearts = event.umbralHearts
	}

	_onCast(event) {
		const actionId = event.ability.guid
		if(actionId === ACTIONS.TRANSPOSE.id && this.invuln.isUntargetable('all', event.timestamp)) {
			this._startRecording(event)
		}
		if (actionId === ACTIONS.BLIZZARD_III.id) {
			const cast = this._rotation.casts[this._rotation.casts.length - 1]
			if (cast && cast.event.ability.guid !== ACTIONS.TRANSPOSE.id) {
				this._stopRecording()
			}
			else {
				this._startWithBlizzardThree ++
				this._stopRecording()
			}
		}
		if (this._inRotation && !getAction(actionId).autoAttack) {
			this._rotation.casts.push(event)
		}
	}

	_startRecording(event) {
		if (!this._inRotation) {
			this._inRotation = true
			this._umbralIceStacks = this._gaugeState.umbralIce
			this._astralFireStacks = this._gaugeState.astralFire
			this._umbralHeartStacks = this._gaugeState.umbralHearts
			this._MP = this.combatants.selected.resources.mp
			OGCDS.forEach( cooldownTracking(ogcs) {
				const name = getAction(ogcds).name
				this._ogcds.push(name)
				this._ogcds[name] = cooldowns.getCooldownRemaining(ogcds)
			})
			this._rotation = {
				start: event.timestamp,
				end: null,
				casts: [],
			}
		}
	}

	_stopRecording() {
		if (this._inRotation) {
			this._inRotation = false
			this._rotation.end = this.parser.currentTimestamp
		}
	}
