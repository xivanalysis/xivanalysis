import {Row as RowConfig} from '../config'

type WithRows = Pick<RowConfig, 'rows'>

export const getMaxChildren = (row: WithRows): number =>
	Math.max(1, row.rows.reduce((acc, cur) => acc + getMaxChildren(cur), 0))

export const getMaxDepth = (rows: WithRows[]): number =>
	rows.reduce((acc, cur) => Math.max(acc, getMaxDepth(cur.rows) + 1), 0)
