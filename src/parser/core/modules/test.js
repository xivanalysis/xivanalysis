import Module from '../Module'

export default class Test extends Module {
	on_init(e) {
		console.log('test init', e)
	}
}
