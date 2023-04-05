import {t} from '@lingui/macro'
import {Defensives} from 'parser/core/modules/Defensives'

export class Mitigation extends Defensives {
	static override handle = 'mitigation'
	static override title = t('mch.mitigation.title')`Mitigation`

	protected override trackedDefensives = [
		this.data.actions.DISMANTLE,
		this.data.actions.TACTICIAN,
	]
}
