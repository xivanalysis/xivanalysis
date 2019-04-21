import {t} from '@lingui/macro'
import {ALL_EVENTS, Module} from 'analyser/Module'

export class EventView extends Module {
	static handle = 'eventView'
	static title = t('core.event-view.title')`Event View`

	protected init() {
		this.addHook(ALL_EVENTS, {}, event => console.log(event))
	}

	output() {
		return 'hello world'
	}
}
