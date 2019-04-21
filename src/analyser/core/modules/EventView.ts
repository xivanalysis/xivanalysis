import {ALL_EVENTS, Module} from 'analyser/Module'

export class EventView extends Module {
	static handle = 'eventView'

	protected init() {
		this.addHook(ALL_EVENTS, event => console.log(event))
	}
}
