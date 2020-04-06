import {Row as RowConfig} from '../config'

// TODO: WeakMap cache this shit

export const getMaxChildren = (row: Pick<RowConfig, 'rows' | 'items'>): number =>
	Math.max(
		getItemCount(row) && 1,
		row.rows.reduce((acc, cur) => acc + getMaxChildren(cur), 0),
	)

export const getMaxDepth = (rows: Array<Pick<RowConfig, 'rows'>>): number =>
	rows.reduce((acc, cur) => Math.max(acc, getMaxDepth(cur.rows) + 1), 0)

export const getItemCount = (row: Pick<RowConfig, 'rows' | 'items'>): number =>
	row.items.length + row.rows.reduce((acc, cur) => acc + getItemCount(cur), 0)
