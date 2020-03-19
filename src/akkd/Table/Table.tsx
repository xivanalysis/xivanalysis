import classNames from 'classnames'
import React from 'react'
import styles from './Table.module.css'
import {TableBody} from './TableBody'
import {TableCell} from './TableCell'
import {TableHeader} from './TableHeader'
import {TableHeaderCell} from './TableHeaderCell'
import {TableRow} from './TableRow'

interface ListItemProps {
	celled?: boolean,
	className?: string,
	collapsing?: boolean,
	compact?: boolean|'very',
	[key: string]: any
}

export class Table extends React.PureComponent<ListItemProps> {
	static Body = TableBody
	static Cell = TableCell
	static Header = TableHeader
	static HeaderCell = TableHeaderCell
	static Row = TableRow

	compactStatus(compact: boolean|'very'|undefined) {
		if (compact === 'very') {
			return styles.veryCompact
		}
		if (compact) {
			return styles.compact
		}
		return styles.notCompact
	}

	render() {
		const {
			celled,
			className,
			collapsing,
			compact,
			children,
			...props
		} = this.props

		return (
			<table {...props}
				className={classNames(
					celled ? styles.celled : styles.noBorder,
					collapsing && styles.collapsing,
					this.compactStatus(compact),
					styles.table,
					className,
				)}>
				{children}
			</table>
		)
	}
}
