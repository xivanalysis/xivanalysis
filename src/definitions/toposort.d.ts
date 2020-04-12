declare module 'toposort' {
	interface ToposortFunction {
		<T>(edges: Array<[T, T]>): T[]
		array<T>(nodes: T[], edges: Array<[T, T]>): T[]
	}
	const toposort: ToposortFunction
	export = toposort
}
