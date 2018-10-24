declare module 'toposort' {
	interface ToposortFunction {
		(edges: Array<[any, any]>): any[]
		array(nodes: any[], edges: Array<[any, any]>): any[]
	}
	const toposort: ToposortFunction
	export = toposort
}
