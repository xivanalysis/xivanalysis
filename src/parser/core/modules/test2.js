import Module from '../Module'

export default class Test2 extends Module {
	static dependencies = ['test']

	on_init(e) {
		console.log('test2 init', e)
	}
}
