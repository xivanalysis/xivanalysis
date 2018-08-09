import React from 'react'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import {ActionLink} from 'components/ui/DbLink'
import {i18nMark, Trans} from '@lingui/react'

const LEYLINE_DURATION = 30000

export default class Leylines extends Module {
	static handle = 'leylines'
	static i18n_id = i18nMark('blm.leylines.title')
	static title = 'Ley Lines'

	static dependencies = [
		'checklist',
	]
	_circleOfPowers = {
		current: null,
		history: [],
	}
	_leyLineHistory = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.LEY_LINES.id,
		}, this._onCastLeyLines)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.CIRCLE_OF_POWER.id,
		}, this._onApplyCircleOfPower)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.CIRCLE_OF_POWER.id,
		}, this._onRemoveCircleOfPower)
		this.addHook('complete', this._onComplete)
	}

	_onCastLeyLines(event) { this._leyLineHistory.push(event.timestamp) }

	_onApplyCircleOfPower(event) {
		if (this._circleOfPowers.current) { this._circleOfPowers.history.push(this._circleOfPowers.current) }

		this._circleOfPowers.current = {
			start: event.timestamp,
			stop: null,
		}
	}

	_onRemoveCircleOfPower(event) {
		if (this._circleOfPowers.current) {
			this._circleOfPowers.current.stop = event.timestamp
		}
		this._circleOfPowers = this._circleOfPowers
	}

	//TODO: make a better one that tracks actual LL durations so that you don't have to filter out the last LL use in a fight.
	_percentFunction(numberOfLeyLines, SumOfCoPUpime) {
		return (SumOfCoPUpime/(numberOfLeyLines*LEYLINE_DURATION))*100
	}

	_onComplete(event) {
		this._circleOfPowers = this._circleOfPowers
		if (this._circleOfPowers.current) {
			if (!this._circleOfPowers.current.stop) {
				this._circleOfPowers.current.stop = event.timestamp
			}
			this._circleOfPowers.history.push(this._circleOfPowers.current)
		}
		//check if there even were any events
		if (!this._circleOfPowers.history.length) { return }
		//filter out the last possible LL usage because it would make things weird.
		this._circleOfPowers.history = this._circleOfPowers.history.filter(cops => cops.start < (event.timestamp - LEYLINE_DURATION))
		this._leyLineHistory = this._leyLineHistory.filter(timestamps => timestamps < (event.timestamp - LEYLINE_DURATION))
		const circleOfPowerDurations = this._circleOfPowers.history.map(cops => Math.max(cops.stop - cops.start, 0))
		const SumOfCoPUpime = circleOfPowerDurations.reduce((accumulator, currentValue) => accumulator + currentValue)
		const numberOfLeyLines = this._leyLineHistory.length

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your Ley Lines</Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your Ley Lines after placing them. Take advantage of Ley Lines' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a Ley Lines' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...ACTIONS.LEY_LINES} />,
					percent: this._percentFunction(numberOfLeyLines, SumOfCoPUpime),
				}),
			],
			//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
			target: 90,
		}))
	}
}
