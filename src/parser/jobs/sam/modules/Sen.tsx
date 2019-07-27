import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

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

const TSUBAME = [
	ACTIONS.KAESHI_HIGANBANA.id,
	ACTIONS.KAESHI_GOKEN.id,
	ACTIONS.KAESHI_SETSUGEKKA.id,
]

export default class Sen extends Module {
	static handle = 'sen'

	@dependency private suggestions!: Suggestions

	private sen: {[S in SEN]?: boolean} = {}
	private allowoverwrite: boolean = false
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
		this.addHook('cast', {by: 'player', abilityId: TSUBAME}, this.overwrite)
		this.addHook('death', {to: 'player'}, this.remove)

		// Suggestion time~
		this.addHook('complete', this.onComplete)
	}

	private onAction(event: CastEvent) {
		const sen = SEN_ACTIONS[event.ability.guid]

		if (this.sen[sen]) {

			if (event.ability.guid === ACTIONS.YUKIKAZE.id && this.allowoverwrite === true) {
				// Nothing happens, reset overwrite to false
				this.allowoverwrite = false
			} else {
			this.wasted++
			}
		}

		this.sen[sen] = true
	}

	private overwrite() {
		// Because of how sen alignment works, every 60 seconds (or 1 tsubame window) a samurai will overwrite one of their sens so they can stay at 3 sen for the exact moment Tsubame is back
		this.allowoverwrite = true

	}

	private remove() {
		this.sen = _.mapValues(this.sen, () => false)
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <Trans id ="sam.sen.suggestion.content">
				You used <ActionLink {...ACTIONS.GEKKO} />, <ActionLink {...ACTIONS.KASHA} />, or <ActionLink {...ACTIONS.YUKIKAZE} /> at a time when you already had that sen, thus wasting a combo because it did not give you sen.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.wasted,
			why: <Trans id = "sam.sen.suggestion.why">You wasted {this.wasted} sen.</Trans>,
		}))
	}
}
