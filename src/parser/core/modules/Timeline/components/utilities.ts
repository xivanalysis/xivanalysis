import {Row as RowConfig} from '../config'

function cached<A extends object, R>(fn: (arg: A) => R) {
	const cache = new WeakMap<A, R>()
	return (arg: A) => {
		let value = cache.get(arg)
		if (value == null) {
			value = fn(arg)
			cache.set(arg, value)
		}
		return value
	}
}

export const getMaxChildren = cached((
	(row: Pick<RowConfig, 'rows' | 'items'>): number =>
		Math.max(
			getItemCount(row) && 1,
			row.rows.reduce((acc, cur) => acc + getMaxChildren(cur), 0),
		)
))

// TODO: Tweak this so I can cache it.
export const getMaxDepth = (rows: Array<Pick<RowConfig, 'rows'>>): number =>
	rows.reduce((acc, cur) => Math.max(acc, getMaxDepth(cur.rows) + 1), 0)

export const getItemCount = cached((
	(row: Pick<RowConfig, 'rows' | 'items'>): number =>
		row.items.length + row.rows.reduce((acc, cur) => acc + getItemCount(cur), 0)
))
