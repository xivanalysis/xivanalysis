import {Module} from './Module'

type ModulesLoader = () => Promise<{default: Array<typeof Module>}>

export class Meta {
	private readonly modulesLoader: ModulesLoader
	private loadedModules: ReadonlyArray<typeof Module> | undefined

	constructor(opts: {
		modules: ModulesLoader,
	}) {
		this.modulesLoader = opts.modules
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
