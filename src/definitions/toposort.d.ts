declare module 'toposort' {
	interface ToposortFunction {
		<T>(edges: [T, T][]): T[]
		array<T>(nodes: T[], edges: [T, T][]): T[]
	}
	const toposort: ToposortFunction
	export = toposort
}
