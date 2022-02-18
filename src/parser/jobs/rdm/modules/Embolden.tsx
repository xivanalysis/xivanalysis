import {t} from '@lingui/macro'
import _ from 'lodash'
import {RaidBuffWindow} from 'parser/core/modules/ActionWindow'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Embolden extends RaidBuffWindow {
	static override handle = 'embolden'
	static override title = t('rdm.embolden.title')`Embolden`
	static override displayOrder = DISPLAY_ORDER.EMBOLDEN
	override buffStatus = [this.data.statuses.EMBOLDEN_SELF, this.data.statuses.EMBOLDEN_PARTY]

	override initialise() {
		super.initialise()
		this.ignoreActions(this.IGNORE_ACTIONS)
	}

	private readonly IGNORE_ACTIONS: number[] = [
		// Only magic damage is affected by Embolden
		this.data.actions.FLECHE.id,
		this.data.actions.CONTRE_SIXTE.id,
		this.data.actions.CORPS_A_CORPS.id,
		this.data.actions.ENGAGEMENT.id,
		this.data.actions.DISPLACEMENT.id,

		// Non-damaging utility
		this.data.actions.ADDLE.id,
		this.data.actions.LUCID_DREAMING.id,
		this.data.actions.MAGICK_BARRIER.id,
		this.data.actions.SURECAST.id,
	]
}
