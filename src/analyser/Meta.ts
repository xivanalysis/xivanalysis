import {PatchNumber} from 'data/PATCHES'
import {Module} from './Module'

type ModulesLoader = () => Promise<{default: Array<typeof Module>}>

interface SupportedPatches {
	from: PatchNumber
	to: PatchNumber
}

export class Meta {
	readonly supportedPatches?: SupportedPatches

	private readonly modulesLoader: ModulesLoader
	private loadedModules?: ReadonlyArray<typeof Module>

	constructor(opts: {
		modules: ModulesLoader,
		supportedPatches?: SupportedPatches,
	}) {
		this.modulesLoader = opts.modules
		this.supportedPatches = opts.supportedPatches
	}

	loadModules() {
		if (this.loadedModules) {
			return Promise.resolve(this.loadedModules)
		}

		return this.modulesLoader()
			.then(({default: modules}) => {
				this.loadedModules = modules
				return modules
			})
	}
}
