import _ from 'lodash'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'

import Kenki from './Kenki'

enum SEN {
	SETSU = 'Setsu',
	GETSU = 'Getsu',
	KA = 'Ka',
}

const SEN_ACTIONS = {
	[ACTIONS.YUKIKAZE.id]: SEN.SETSU,

	[ACTIONS.GEKKO.id]: SEN.GETSU,
	[ACTIONS.MANGETSU.id]: SEN.GETSU,

	[ACTIONS.KASHA.id]: SEN.KA,
	[ACTIONS.OKA.id]: SEN.KA,
}

const IAIJUTSU = [
	ACTIONS.HIGANBANA.id,
	ACTIONS.TENKA_GOKEN.id,
	ACTIONS.MIDARE_SETSUGEKKA.id,
]

const KENKI_PER_SEN = 20

export default class Sen extends Module {
	static handle = 'sen'

	@dependency private kenki!: Kenki
	@dependency private suggestions!: Suggestions

	private sen: {[S in SEN]?: boolean} = {}
	private wasted = 0

	protected init() {
		// Track sen gain
		this.addHook(
			'cast',
			{by: 'player', abilityId: Object.keys(SEN_ACTIONS).map(Number)},
			this.onAction,
		)

		// Death, as well as all Iaijutsu, remove all available sen
		this.addHook('cast', {by: 'player', abilityId: IAIJUTSU}, this.remove)
		this.addHook('death', {to: 'player'}, this.remove)

		// Hagakure because he's a speshul boi
		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.HAGAKURE.id},
			this.onHagakure,
		)

		// Suggestion time~
		this.addHook('complete', this.onComplete)
	}

	private onAction(event: CastEvent) {
		const sen = SEN_ACTIONS[event.ability.guid]

		if (this.sen[sen]) {
			this.wasted++
		}

		this.sen[sen] = true
	}

	private remove() {
		this.sen = _.mapValues(this.sen, () => false)
	}

	private onHagakure() {
		// Work out how many sen are currently active
		const activeSen = Object.values(this.sen)
			.filter(active => active)
			.length

		// Add the new kenki, wipe the sen
		this.kenki.modify(activeSen * KENKI_PER_SEN)
		this.remove()
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <>
				You used <ActionLink {...ACTIONS.GEKKO} />, <ActionLink {...ACTIONS.KASHA} />, or <ActionLink {...ACTIONS.YUKIKAZE} /> at a time when you already had that sen, thus wasting a combo because it did not give you sen.
			</>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.wasted,
			why: <>You wasted {this.wasted} sen.</>,
		}))
	}
}
