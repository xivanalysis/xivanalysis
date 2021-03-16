import {Trans} from '@lingui/macro'
import {Contributor, Role} from 'data/CONTRIBUTORS'
import {PatchNumber} from 'data/PATCHES'
import _ from 'lodash'
import React from 'react'
import {Injectable} from './Injectable'

type ModulesLoader = () => Promise<{default: Array<typeof Injectable>}>

/** Representation of patches supported by a meta instance. */
export interface SupportedPatches {
	from: PatchNumber
	to: PatchNumber
}

/** Representation of a contributor's role in developing modules. */
export interface ContributorRole {
	user: Contributor
	role: Role
}

/** Representation of a single entry within the changelog for a meta instance. */
export interface ChangelogEntry {
	date: Date
	contributors: Contributor[]
	Changes: React.ComponentType
}

export class Meta {
	readonly supportedPatches?: SupportedPatches
	readonly Description?: React.ComponentType
	readonly contributors: ContributorRole[]
	readonly changelog: ChangelogEntry[]

	private readonly modulesLoader: ModulesLoader
	private loadedModules?: ReadonlyArray<typeof Injectable>

	constructor(opts: {
		modules: ModulesLoader,
		supportedPatches?: SupportedPatches,
		Description?: React.ComponentType,
		contributors?: ContributorRole[],
		changelog?: ChangelogEntry[],
	}) {
		this.modulesLoader = opts.modules
		this.supportedPatches = opts.supportedPatches
		this.Description = opts.Description
		this.contributors = opts.contributors || []
		this.changelog = opts.changelog || []
	}

	/**
	 * Ensure all modules in the current meta have been loaded, and return them.
	 */
	getModules() {
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
		const currentDate: Date = new Date();
		const isAprilFirst: Boolean = currentDate.getDate() === 1 && currentDate.getMonth() === 2; // JS months are 0-indexed because reasons

		return new Meta({
			// Modules should contain all loaded modules
			modules: () => Promise.all([this.getModules(), meta.getModules()])
				.then(groupedModules => ({default: _.flatten(groupedModules)})),

			// New sets of supported patches override old ones
			// TODO: Perhaps narrow as meta is merged?
			supportedPatches: meta.supportedPatches,

			// Descriptions are merged all lovely and jsx like. Jobs are loaded
			// after zones and core, so the new meta should be above the old.
			// TODO: Headers? Somehow?
			Description: () => <>
				{isAprilFirst && <>
					<div style={{display: 'flex', marginBottom: '10px'}}>
						<img src={require('../../data/avatar/Clippy.png')} style={{width: '40px', marginRight: '1.5em'}}/>
						<div>
							<Trans id="meta.easter-eggs.april-fools">You look like you're trying to play FFXIV? Would you like some help?</Trans>
						</div>
					</div>
				</>}
				{meta.Description && <meta.Description/>}
				{this.Description && <this.Description/>}
			</>,

			// All listed contributors should be acknowledged
			// TODO: Merge shared users?
			contributors: [
				...meta.contributors,
				...this.contributors,
			],

			// Merge changelog with respect to dates (reverse chronological)
			changelog: _.sortBy([
				...meta.changelog,
				...this.changelog,
			], 'date'),
		})
	}
}
