import {Contributor, Role} from 'data/CONTRIBUTORS'
import {PatchNumber} from 'data/PATCHES'
import _ from 'lodash'
import React from 'react'
import {Module} from './Module'

type ModulesLoader = () => Promise<{default: Array<typeof Module>}>

export interface SupportedPatches {
	from: PatchNumber
	to: PatchNumber
}

export interface ContributorRole {
	user: Contributor
	role: Role
}

export class Meta {
	readonly supportedPatches?: SupportedPatches
	readonly Description?: React.ComponentType
	readonly contributors?: ContributorRole[]

	private readonly modulesLoader: ModulesLoader
	private loadedModules?: ReadonlyArray<typeof Module>

	constructor(opts: {
		modules: ModulesLoader,
		supportedPatches?: SupportedPatches,
		Description?: React.ComponentType,
		contributors?: ContributorRole[],
	}) {
		this.modulesLoader = opts.modules
		this.supportedPatches = opts.supportedPatches
		this.Description = opts.Description
		this.contributors = opts.contributors
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

			// Descriptions are merged all lovely and jsx like. Jobs come after zones
			// and core, so the new meta should be above the old.
			// TODO: Headers? Somehow?
			Description: () => <>
				{meta.Description && <meta.Description/>}
				{this.Description && <this.Description/>}
			</>,

			// All listed contributors should be acknowledged
			// TODO: Merge shared users?
			contributors: [
				...(meta.contributors || []),
				...(this.contributors || []),
			],
		})
	}
}
