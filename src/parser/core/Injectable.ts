import {Debuggable} from 'parser/core/Debuggable'
import 'reflect-metadata'

/**
 * Mark the decorated property as a dependency. The dependency will be injected
 * during construction, and will be available for the lifetime of the instance.
 */
export function dependency(target: Injectable, prop: string) {
	const dependency = Reflect.getMetadata('design:type', target, prop)
	const constructor = target.constructor as typeof Injectable

	// DO NOT REMOVE
	// This totally-redundant line is a workaround for an issue in FF ~73 which causes the
	// assignment in the conditional below to completely kludge the entire array regardless
	// of it's contents if this isn't here.
	const constructorDependencies = constructor.dependencies

	// Make sure we're not modifying every single instance
	if (!Object.hasOwnProperty.call(constructor, 'dependencies')) {
		constructor.dependencies = [...constructorDependencies]
	}

	// If the dep is Object, it's _probably_ from a JS file. Fall back to simple handling
	if (dependency === Object) {
		constructor.dependencies.push(prop)
		return
	}

	// Check that the dep is actually an injectable
	if (!Object.isPrototypeOf.call(Injectable, dependency)) {
		throw new Error(`${constructor.name}'s dependency \`${prop}\` is invalid. Expected \`Injectable\`, got \`${dependency.name}\`.`)
	}

	constructor.dependencies.push({
		handle: dependency.handle,
		prop,
	})
}

/**
 * DO NOT USE OR YOU WILL BE FIRED
 * Totally spit in the face of the entire dependency system by forcing it
 * to execute the decorated injectable before the module passed as an argument.
 * If you have to think whether you need this or not, you don't need it.
 */
export const executeBeforeDoNotUseOrYouWillBeFired = (target: typeof Injectable) =>
	<T extends typeof Injectable>(source: T): T => {
		target.dependencies.push(source.handle)
		return source
	}

export interface MappedDependency {
	handle: string
	prop: string
}

export interface InjectableOptions {
	/** Currently available injectables mapped by their handle */
	container: Record<string, Injectable>
}

/**
 * Base dependency injection logic. Injectables can be injected into each other by
 * specifying dependencies within the class definition.
 */
export class Injectable extends Debuggable {
	static dependencies: Array<string | MappedDependency> = []

	private static _handle: string
	/** Name to be used throughout the dependency system to refer to this injectable. */
	static get handle() {
		if (!this._handle) {
			throw new Error(`Injectable \`${this.name}\` does not have an explicitly set handle. You can use \`static handle = '${this.name.toLowerCase()}'\` to specify a handle.`)
		}
		return this._handle
	}
	static set handle(value) {
		this._handle = value
	}

	constructor({container}: InjectableOptions) {
		super()

		const injectable = this.constructor as typeof Injectable
		for (const dependency of injectable.dependencies) {
			// If the dependency is a plain string, normalise it to the mapped representation
			const mapped = typeof dependency === 'string'
				? {handle: dependency, prop: dependency}
				: dependency

			// Assign the dependency to the class instance
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			; (this as any)[mapped.prop] = container[mapped.handle]
		}
	}
}
