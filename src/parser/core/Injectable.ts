import {Debuggable} from 'parser/core/Debuggable'

const DEPENDENCY_METADATA = Symbol('dependency metadata')
type DependencyMetadata = Partial<Record<string, DependencyEntry>>
interface DependencyEntry {
	field?: string
	type?: typeof Injectable | object
}

/**
 * Mark the decorated property as a dependency. The dependency will be injected
 * during construction, and will be available for the lifetime of the instance.
 */
export function dependency(_: undefined, context: ClassFieldDecoratorContext) {
	const {name} = context
	if (typeof name !== 'string') {
		throw new Error('unexpected non-string dependency field name')
	}

	updateDepMeta(context, current => ({...current, field: name}))
}

// Used by `/conf/babel-plugin-xiva-dependency`
dependency.type = function(type: typeof Injectable) {
	return function decorator(_: undefined, context: ClassFieldDecoratorContext) {
		updateDepMeta(context, current => ({...current, type}))
	}
}

function updateDepMeta(
	{name, metadata}: ClassFieldDecoratorContext,
	transform: (depMeta: DependencyEntry) => DependencyEntry
) {
	if (typeof name !== 'string') {
		throw new Error('unexpected non-string dependency field name')
	}

	// NOTE: This is using copying / reassignment, rather than mutation, to ensure
	// we don't leak dependencies from subclasses up to their parents. The
	// `metadata` object's prototype is set according to inheritance, so assigning
	// a clean value will inherit parent values while avoiding leaks.
	const meta = (metadata[DEPENDENCY_METADATA] ?? {}) as DependencyMetadata
	metadata[DEPENDENCY_METADATA] = {
		...meta,
		[name]: transform(meta[name] ?? {}),
	}
}

function resolveDependencyHandle(entry: DependencyEntry): string | undefined {
	// If there's no type info, or it's set to Object, we assume it's one of the
	// zero remaining JS files.
	if (entry.type == null || entry.type === Object) {
		return
	}

	// Ensure that the dependency is actually an injectable
	if (!Object.isPrototypeOf.call(Injectable, entry.type)) {
		throw new Error(`invalid dependency type ${entry.type}`)
	}

	return (entry.type as typeof Injectable).handle
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
	static get dependencies(): MappedDependency[] {
		const meta = this[Symbol.metadata]?.[DEPENDENCY_METADATA] as DependencyMetadata | undefined

		// If there's no meta, we assume there's just no deps.
		if (meta == null) {
			return []
		}

		const dependencies: MappedDependency[] = []
		for (const entry of Object.values(meta)) {
			if (entry == null) { continue }
			if (entry.field == null) {
				throw new Error('dependency with no field')
			}

			dependencies.push({
				prop: entry.field,
				handle: resolveDependencyHandle(entry) ?? entry.field,
			})
		}

		return dependencies
	}

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
