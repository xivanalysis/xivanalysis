export type Handle = string

interface MappedDependency {
	handle: Handle
	prop: string
}

export class Module {
	static dependencies: Array<Handle | MappedDependency> = []

	private static _handle: Handle
	static get handle() {
		if (!this._handle) {
			throw new Error(`Module \`${this.name}\` does not have a handle.`)
		}
		return this._handle
	}
	static set handle(value) {
		this._handle = value
	}
}
