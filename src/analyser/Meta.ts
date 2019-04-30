import {PatchNumber} from 'data/PATCHES'
import _ from 'lodash'
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

	/**
	 * Asynchronously run the specified module loader, and return the
	 * resulting modules
	 */
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

	/** Create a new meta object containing merged data */
	merge(meta: Meta): Meta {
		return new Meta({
			// Modules should contain all loaded modules
			modules: () => Promise.all([this.loadModules(), meta.loadModules()])
				.then(groupedModules => ({default: _.flatten(groupedModules)})),
			// New sets of supported patches override old ones
			supportedPatches: meta.supportedPatches,
		})
	}
}
