import {t} from '@lingui/macro'
import {BuffWindow} from 'parser/core/modules/ActionWindow'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Embolden extends BuffWindow {
	static override handle = 'embolden'
	static override title = t('rdm.embolden.title')`Embolden`
	static override displayOrder = DISPLAY_ORDER.EMBOLDEN

	override buffStatus = this.data.statuses.EMBOLDEN_SELF

	override initialise() {
		super.initialise()
		this.ignoreActions([
			this.data.actions.FLECHE.id,
			this.data.actions.CONTRE_SIXTE.id,
			this.data.actions.CORPS_A_CORPS.id,
			this.data.actions.ENGAGEMENT.id,
			this.data.actions.DISPLACEMENT.id,
		])
	}
}
