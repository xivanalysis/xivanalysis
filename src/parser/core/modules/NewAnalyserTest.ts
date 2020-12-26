import {Events} from 'event'
import {Analyser} from '../Analyser'

export class NewAnalyserTest extends Analyser {
	static handle = 'newTest'

	initialise() {
		// TESTS
		// this.addEventHook('damage', event => {})
		// this.addEventHook({type: 'damage'}, event => {})
		const hook = this.addEventHook({amount: 0}, event => console.log(event))
		this.removeEventHook(hook)
	}

	output() {
		return 'hi'
	}
}
