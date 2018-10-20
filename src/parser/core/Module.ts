import {cloneDeep} from 'lodash'
import 'reflect-metadata'

import {Event} from 'fflogs'
import Parser from './Parser'

export const DISPLAY_ORDER = {
	TOP: 0,
	DEFAULT: 50,
	BOTTOM: 100,
}

export function dependency(target: Module, prop: string) {
	const dependency = Reflect.getMetadata('design:type', target, prop)
	const constructor = target.constructor as typeof Module

	// Make sure we're not modifying every single module
	if (constructor.dependencies === Module.dependencies) {
		constructor.dependencies = []
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

interface MappedDependency {
	handle: string
	prop: string
}

type Filter<T extends Event> = Partial<T> & Partial<{
	abilityId: number // TODO
	to: 'player' | 'pet' | T['targetID']
	by: 'player' | 'pet' | T['sourceID']
}>

type HookCallback<T extends Event> = (event: T) => void

interface Hook<T extends Event> {
	events: T['type'][]
	filter: Filter<T>
	callback: HookCallback<T>
}

export default class Module {
	static dependencies: Array<string | MappedDependency> = []
	static displayOrder = DISPLAY_ORDER.DEFAULT

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

	private static _title: string
	static get title() {
		if (!this._title) {
			this._title = this.handle.charAt(0).toUpperCase() + this.handle.slice(1)
		}
		return this._title
	}
	static set title(value) {
		this._title = value
	}

	// DI FunTimes™
	[key: string]: any;

	// TODO
	private _hooks = new Map<Event['type'], Set<Hook<Event>>>()

	constructor(
		protected readonly parser: Parser
	) {
		const module = this.constructor as typeof Module
		module.dependencies.forEach(dep => {
			if (typeof dep === 'string') {
				dep = {handle: dep, prop: dep}
			}

			this[dep.prop] = parser.modules[dep.handle]
		})
		this.init()
	}

	// So TS peeps don't need to pass the parser down
	protected init() {}

	normalise(events: Event[]) {
		return events
	}

	/**
	 * This method is called when an error occurs, either when running
	 * event hooks or calling {@link Module#output} in this module or
	 * a module that depends on this module.
	 * @param {String} source Either 'event' or 'output'
	 * @param {Error} error The error that occurred
	 * @param {Object} event The event that was being processed when the error occurred, if source is 'event'
	 * @returns {Object|undefined} The data to attach to automatic error reports, or undefined to rely on primitive value detection
	 */
	getErrorContext(source: 'event' | 'output', error: Error, event?: Event): any {
		return
	}

	protected addHook<T extends Event>(
		events: T['type'] | T['type'][],
		cb: HookCallback<T>
	): Hook<T>
	protected addHook<T extends Event>(
		events: T['type'] | T['type'][],
		filter: Filter<T> | HookCallback<T>,
		cb: HookCallback<T>,
	): Hook<T>
	protected addHook<T extends Event>(
		events: T['type'] | T['type'][],
		_filter: Filter<T> | HookCallback<T>,
		_cb?: HookCallback<T>,
	): Hook<T> | undefined {
		// I'm currently handling hooks at the module level
		// Should performance become a concern, this can be moved up to the Parser without breaking the API
		const cb = typeof _filter === 'function'? _filter : _cb
		let filter = typeof _filter === 'function'? {} : _filter

		// If there's no callback just... stop
		if (!cb) { return }

		// QoL filter transforms
		filter = this.mapFilterEntity(filter, 'to', 'targetID')
		filter = this.mapFilterEntity(filter, 'by', 'sourceID')
		if (filter.abilityId) {
			if (!filter.ability) {
				filter.ability = {}
			}
			filter.ability.guid = filter.abilityId
			delete filter.abilityId
		}

		// Make sure events is an array
		if (!Array.isArray(events)) {
			events = [events]
		}

		// Final hook representation
		const hook = {
			events,
			filter,
			callback: cb.bind(this),
		}

		// Hook for each of the events
		events.forEach(event => {
			let hooks = this._hooks.get(event)

			// Make sure the map has a key for us
			if (!hooks) {
				hooks = new Set()
				this._hooks.set(event, hooks)
			}

			// Set the hook
			hooks.add(hook)
		})

		// Return the hook representation so it can be removed (later)
		return hook
	}

	private mapFilterEntity<T extends Event>(
		filter: Filter<T>,
		qol: keyof Filter<T>,
		raw: keyof T,
	) {
		if (!filter[qol]) { return filter }

		const _filter = cloneDeep(filter)

		// TODO: Typing on parser req. for some of this stuff
		switch (_filter[qol]) {
			case 'player':
				_filter[raw] = this.parser.player.id
				break
			case 'pet':
				_filter[raw] = this.parser.player.pets.map((pet: any) => pet.id)
				break
			default:
				_filter[raw] = _filter[qol]
		}

		delete _filter[qol]

		return _filter
	}

	// TODO: Test
	protected removeHook(hook: Hook<any>) {
		hook.events.forEach(event => {
			const hooks = this._hooks.get(event)
			if (!hooks) { return }
			hooks.delete(hook)
		})
	}

	triggerEvent(event: Event) {
		// Run through registered hooks. Avoid calling 'all' on symbols, they're internal stuff.
		if (typeof event.type !== 'symbol') {
			this._runHooks(event, this._hooks.get('all'))
		}
		this._runHooks(event, this._hooks.get(event.type))
	}

	private _runHooks(event: Event, hooks?: Set<Hook<Event>>) {
		if (!hooks) { return }
		hooks.forEach(hook => {
			// Check the filter
			if (!this._filterMatches(event, hook.filter)) {
				return
			}

			hook.callback(event)
		})
	}

	private _filterMatches(event: Event, filter: Filter<Event>) {
		const match = Object.keys(filter).every(key => {
			// If the event doesn't have the key we're looking for, just shortcut out
			if (!event.hasOwnProperty(key)) {
				return false
			}

			const filterVal = filter[key]
			const eventVal = event[key]

			// FFLogs doesn't use arrays inside events themselves, so I'm using them to handle multiple possible values
			if (Array.isArray(filterVal)) {
				return filterVal.includes(eventVal)
			}

			// If it's an object, I need to dig down. Mostly for the `ability` key
			if (typeof filterVal === 'object') {
				return this._filterMatches(eventVal, filterVal)
			}

			// Basic value check
			return filterVal === eventVal
		})

		return match
	}

	output() {
		return false
	}
}
