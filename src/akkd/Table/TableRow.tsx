import classNames from 'classnames'
import React from 'react'
import styles from './Table.module.css'

interface ListItemProps {
	className?: string,
	positive?: boolean,
	negative?: boolean,
	warning?: boolean,
	[key: string]: any
}

export class TableRow extends React.PureComponent<ListItemProps> {

	render() {
		const {
			className,
			positive,
			negative,
			warning,
			children,
			...props
		} = this.props

		return (
			<tr {...props}
				className={classNames(
					positive && styles.positive,
					negative && styles.negative,
					warning && styles.warning,
					className,
				)}>
				{children}
			</tr>
		)
	}
}
