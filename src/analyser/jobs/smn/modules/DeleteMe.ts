import {Module} from 'analyser/Module'

export class DeleteMe extends Module {
	static handle = 'deleteMe'
	output() {
		return 'SMN loaded fam'
	}
}
