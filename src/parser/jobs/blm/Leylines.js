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
	_CircleOfPowers = {
		current: null,
		history: [],
	}
	_LeyLineHistory = []

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

	_onCastLeyLines(event) {
		this.ll = this._LeyLineHistory
		this.ll.push(event.timestamp)

	}

	_onApplyCircleOfPower(event) {
		this.cop = this._CircleOfPowers
		if (this.cop.current) { this.cop.history.push(this.cop.current) }

		this.cop.current = {
			start: event.timestamp,
			stop: null,
		}
		this._CircleOfPowers = this.cop
	}

	_onRemoveCircleOfPower(event) {
		this.cop = this._CircleOfPowers
		if (this.cop.current) {
			this.cop.current.stop = event.timestamp
		}
		this._CircleOfPowers = this.cop
	}

	_percentFunction(numberOfLeyLines, SumOfCoPUpime) {
		return (SumOfCoPUpime/(numberOfLeyLines*LEYLINE_DURATION))*100
	}

	_onComplete(event) {
		this.cop = this._CircleOfPowers
		if (!this.cop.history.length) { return }
		if (this.cop.current) {
			if (!this.cop.current.stop) {
				this.cop.current.stop = event.timestamp
			}
			this.cop.history.push(this.cop.current)
		}
		//filter out the last possible LL usage because it would make things weird.
		this.cop.history.filter(cops => cops.start < (event.timestamp - LEYLINE_DURATION))
		this._LeyLineHistory.filter(timestamps => timestamps < (event.timestamp - LEYLINE_DURATION))
		const circleOfPowerDurations = this.cop.history.map(cops => Math.max(cops.stop - cops.start, 0))
		const SumOfCoPUpime = circleOfPowerDurations.reduce((accumulator, currentValue) => accumulator + currentValue)
		const numberOfLeyLines = this._LeyLineHistory.length

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your Ley Lines</Trans>,
			description: <Trans id="blm.leylines.checklist">Maximize the time you stay in your Ley Lines, but don't get hit unneccessarly by AOEs, or tell your Healers to adjust. Preplanning its uses is key, as always.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...ACTIONS.LEY_LINES} />,
					percent: this._percentFunction(numberOfLeyLines, SumOfCoPUpime),
				}),
			],
			//pretty random. Should be revised, maybe based on fights?
			target: 95,
		}))
	}
}
