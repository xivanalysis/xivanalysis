import {DrgBuffWindowModule} from './DrgBuffWindow'
import React from 'react'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class DragonSight extends DrgBuffWindowModule {
	static handle = 'dragonsight'
	static title = t('drg.dragonsight.title')`Dragon Sight`
	static displayOrder = DISPLAY_ORDER.DRAGON_SIGHT

	buffAction = ACTIONS.DRAGON_SIGHT
	buffStatus = [STATUSES.RIGHT_EYE, STATUSES.RIGHT_EYE_SOLO]

	private soloDragonSight: boolean = false

	protected init() {
		super.init()
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.RIGHT_EYE_SOLO.id}, () => this.soloDragonSight = true)
	}

	protected onComplete() {
		super.onComplete()

		if (this.soloDragonSight) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DRAGON_SIGHT.icon,
				content: <Trans id="drg.buffs.suggestions.solo-ds.content">
					Although it doesn't impact your personal DPS, try to always use Dragon Sight on a partner in group content so that someone else can benefit from the damage bonus too.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="drg.buffs.suggestions.solo-ds.why">
					At least 1 of your Dragon Sight casts didn't have a tether partner.
				</Trans>,
			}))
		}
	}
}
