import {MessageDescriptor} from '@lingui/core'
import Color from 'color'
import {Ability, AbilityEvent, Pet, FflogsEvent} from 'fflogs'
import {Event} from 'events'
import {cloneDeep} from 'lodash'
import 'reflect-metadata'
import {EventHook, EventHookCallback, Filter, FilterPartial, TimestampHook, TimestampHookCallback} from './Dispatcher'
import Parser from './Parser'
import {ensureArray} from 'utilities'

export enum DISPLAY_ORDER {
	TOP = 0,
	DEFAULT = 50,
	BOTTOM = 100,
}

export enum DISPLAY_MODE {
	COLLAPSIBLE,
	FULL,
	/** Don't use this unless you know what you're doing, and you've run it past me. */
	RAW,
}

export function dependency(target: Module, prop: string) {
	const dependency = Reflect.getMetadata('design:type', target, prop)
	const constructor = target.constructor as typeof Module

	// DO NOT REMOVE
	// This totally-redundant line is a workaround for an issue in FF ~73 which causes the
	// assignment in the conditional below to completely kludge the entire array regardless
	// of it's contents if this isn't here.
	const constructorDependencies = constructor.dependencies

	// Make sure we're not modifying every single module
	if (!constructor.hasOwnProperty('dependencies')) {
		constructor.dependencies = [...constructorDependencies]
	}

	// If the dep is Object, it's _probably_ from a JS file. Fall back to simple handling
	if (dependency === Object) {
		constructor.dependencies.push(prop)
		return
	}

	// Check that the dep is actually a module
	if (!Module.isPrototypeOf(dependency)) {
		throw new Error(`${constructor.name}'s dependency \`${prop}\` is invalid. Expected \`Module\`, got \`${dependency.name}\`.`)
	}

	constructor.dependencies.push({
		handle: dependency.handle,
		prop,
	})
}

/**
 * DO NOT USE OR YOU WILL BE FIRED
 * Totally spit in the face of the entire dependency system by forcing it
 * to execute the decorated module before the module passed as an argument.
 * If you have to think whether you need this or not, you don't need it.
 */
export const executeBeforeDoNotUseOrYouWillBeFired = (target: typeof Module) =>
	(source: typeof Module) => {
		target.dependencies.push(source.handle)
		return source
	}

export interface MappedDependency {
	handle: string
	prop: string
}

type ModuleFilter<T extends Event> = Filter<T> & FilterPartial<{
	abilityId: Ability['guid'],
	to: 'player' | 'pet' | FflogsEvent['targetID'],
	by: 'player' | 'pet' | FflogsEvent['sourceID'],
}>

type LogParams = Parameters<typeof console.log>
interface DebugFnOpts {
	log: (...messages: LogParams) => void
}
type DebugFn = (opts: DebugFnOpts) => void

export default class Module {
	static dependencies: Array<string | MappedDependency> = []
	static displayOrder: number = DISPLAY_ORDER.DEFAULT
	static displayMode: DISPLAY_MODE
	// TODO: Refactor this var
	static i18n_id?: string // tslint:disable-line
	static debug: boolean = false

	private static _handle: string
	static get handle() {
		if (!this._handle) {
			const handle = this.name.charAt(0).toLowerCase() + this.name.slice(1)
			console.error(`\`${this.name}\` does not have an explicitly set handle. Using \`${handle}\`. This WILL break in minified builds.`)
			this._handle = handle
		}
		return this._handle
	}
	static set handle(value) {
		this._handle = value
	}

	private static _title: string | MessageDescriptor
	static get title() {
		if (!this._title) {
			this._title = this.handle.charAt(0).toUpperCase() + this.handle.slice(1)
		}
		return this._title
	}
	static set title(value) {
		this._title = value
	}

	private _debugHeaderColor?: Color
	private get debugHeaderColor() {
		if (!this._debugHeaderColor) {
			const handle = (this.constructor as typeof Module).handle
			const seed = handle.split('').reduce((acc, cur) => acc + cur.charCodeAt(0), 0)
			// tslint:disable-next-line:no-magic-numbers
			this._debugHeaderColor = Color.hsl(seed % 255, 255, 65)
		}
		return this._debugHeaderColor
	}

	constructor(
		protected readonly parser: Parser,
	) {
		const module = this.constructor as typeof Module
		module.dependencies.forEach(dep => {
			if (typeof dep === 'string') {
				dep = {handle: dep, prop: dep}
			}

			// TS Modules should use the @dependency decorator to pull them in,
			// but this is still required for JS modules (and internal handling)
			(this as any)[dep.prop] = parser.modules[dep.handle]
		})
	}

	/**
	 * Because JS construct order is jank and nobody can fix it. Don't call this.
	 * Please. I'm begging you.
	 * @todo refactor `init` to public so this shit isn't needed.
	 */
	doTheMagicInitDance() {
		this.init()
	}

	// So TS peeps don't need to pass the parser down
	protected init() {}

	normalise(events: Event[]): Event[] | Promise<Event[]> {
		return events
	}

	/**
	 * This method is called when an error occurs, either when running
	 * event hooks or calling {@link Module#output} in this module or
	 * a module that depends on this module.
	 * @param source Either 'event' or 'output'
	 * @param error The error that occurred
	 * @param event The event that was being processed when the error occurred, if source is 'event'
	 * @returns The data to attach to automatic error reports, or undefined to rely on primitive value detection
	 */
	getErrorContext(source: 'event' | 'output', error: Error, event?: Event): any {
		return
	}

	/**
	 * Deprecated pass-through for `addEventHook`, maintained for backwards compatibility.
	 * @deprecated
	 */
	// tslint:disable-next-line:member-ordering
	protected readonly addHook = this.addEventHook

	protected addEventHook<T extends Event>(
		events: T['type'] | ReadonlyArray<T['type']>,
		cb: EventHookCallback<T>,
	): Array<EventHook<T>>
	protected addEventHook<T extends Event>(
		events: T['type'] | ReadonlyArray<T['type']>,
		filter: ModuleFilter<T>,
		cb: EventHookCallback<T>,
	): Array<EventHook<T>>
	protected addEventHook<T extends Event>(
		events: T['type'] | ReadonlyArray<T['type']>,
		filterArg: ModuleFilter<T> | EventHookCallback<T>,
		cbArg?: EventHookCallback<T>,
	): Array<EventHook<T>> {
		// I'm currently handling hooks at the module level
		// Should performance become a concern, this can be moved up to the Parser without breaking the API
		const cb = typeof filterArg === 'function'? filterArg : cbArg
		let filter: ModuleFilter<T> = typeof filterArg === 'function'? {} : filterArg

		// If there's no callback just... stop
		if (!cb) { return [] }

		const eventTypes = ensureArray(events)

		// QoL filter transforms
		filter = this.mapFilterEntity(filter, 'to', 'targetID')
		filter = this.mapFilterEntity(filter, 'by', 'sourceID')
		if (filter.abilityId !== undefined) {
			const abilityFilter = filter as ModuleFilter<AbilityEvent>
			if (!abilityFilter.ability) {
				abilityFilter.ability = {}
			}
			abilityFilter.ability.guid = abilityFilter.abilityId
			delete abilityFilter.abilityId
		}

		// Fflogs actor IDs are numbers, generic report structure actor IDs
		// are strings. While we're trying to deal with both, normalise
		// filter actor IDs to numbers to patch over the difference.
		// TODO: REMOVE
		const fixTypeDiscrepancy = (base: any): any =>
			ensureArray(base).map(val => parseInt(val, 10))
		if (filter.sourceID != null) {
			filter.sourceID = fixTypeDiscrepancy(filter.sourceID)
		}
		if (filter.targetID != null) {
			filter.targetID = fixTypeDiscrepancy(filter.targetID)
		}

		const hooks = eventTypes.map(event => ({
			event,
			filter,
			module: (this.constructor as typeof Module).handle,
			callback: cb.bind(this),
		}))

		hooks.forEach(hook => this.parser.dispatcher.addEventHook(hook))

		return hooks
	}

	// We don't talk about the type casts here
	private mapFilterEntity<T extends Event>(
		filterArg: ModuleFilter<T>,
		qol: keyof ModuleFilter<T>,
		raw: keyof FflogsEvent,
	): ModuleFilter<T> {
		if (!filterArg[qol]) { return filterArg }

		const filter = cloneDeep(filterArg) as Filter<FflogsEvent>

		// Sorry not sorry for the `any`s. Ceebs working out this filter _again_.
		switch (filterArg[qol]) {
			case 'player':
				filter[raw] = this.parser.player.id as any
				break
			case 'pet':
				filter[raw] = this.parser.player.pets.map((pet: Pet) => pet.id) as any
				break
			default:
				filter[raw] = filterArg[qol] as any
		}

		delete filter[qol as keyof typeof filter]

		return filter as ModuleFilter<T>
	}

	/**
	 * Deprecated pass-through for `removeEventHook`, maintained for backwards compatibility.
	 * @deprecated
	 */
	// tslint:disable-next-line:member-ordering
	protected readonly removeHook = this.removeEventHook

	/** Remove a previously added event hook. */
	protected removeEventHook(hooks: Array<EventHook<any>>) {
		hooks.forEach(hook => this.parser.dispatcher.removeEventHook(hook))
	}

	/** Add a hook for a timestamp. The provided callback will be fired a single time when the parser reaches the specified timestamp. */
	protected addTimestampHook(timestamp: number, cb: TimestampHookCallback) {
		const hook = {
			timestamp,
			module: (this.constructor as typeof Module).handle,
			callback: cb.bind(this),
		}
		this.parser.dispatcher.addTimestampHook(hook)
		return hook
	}

	/** Remove a previously added timestamp hook */
	protected removeTimestampHook(hook: TimestampHook) {
		this.parser.dispatcher.removeTimestampHook(hook)
	}

	/**
	 * Log a debug console message. Will only be printed if built in a non-production
	 * environment, with `static debug = true` in the module it's being executed in.
	 */
	protected debug(debugFn: DebugFn): void
	protected debug(...messages: LogParams): void
	protected debug(...messages: [DebugFn] | LogParams) {
		const module = this.constructor as typeof Module

		if (!module.debug || process.env.NODE_ENV === 'production') {
			return
		}

		typeof messages[0] === 'function'
			? messages[0]({log: this.debugLog})
			: this.debugLog(...messages)
	}

	private debugLog = (...messages: LogParams) => {
		const module = this.constructor as typeof Module
		// tslint:disable-next-line:no-console
		console.log(
			`[%c${module.handle}%c]`,
			`color: ${this.debugHeaderColor}`,
			'color: inherit',
			...messages,
		)
	}

	output(): React.ReactNode {
		return false
	}
}
