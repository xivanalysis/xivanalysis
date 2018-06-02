import Module, { DISPLAY_ORDER } from 'parser/core/Module'

export default class About extends Module {
	static displayOrder = DISPLAY_ORDER.ABOUT
	name = 'About'

	output() {
		return 'This isn\'t even remotely done.'
	}
}
