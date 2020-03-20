import classNames from 'classnames'
import React from 'react'
import styles from './Table.module.css'

interface ListItemProps {
	className?: string,
	collapsing?: boolean,
	textAlign?: string,
	positive?: boolean,
	negative?: boolean,
	warning?: boolean,
	[key: string]: any,
}

export class TableCell extends React.PureComponent<ListItemProps> {
	textAlignment(textAlign: string|undefined) {
		switch (textAlign) {
			case 'center':
				return styles.center
			case 'right':
				return styles.right
			case 'left':
			default:
				return styles.left
		}
	}

	render() {
		const {
			className,
			collapsing,
			textAlign,
			positive,
			negative,
			warning,
			children,
			...props
		} = this.props

		return (
			<td {...props}
					className={classNames(
					collapsing && styles.collapsingCell,
					positive && styles.positive,
					negative && styles.negative,
					warning && styles.warning,
					this.textAlignment(textAlign),
					className,
				)}>
				{children}
			</td>
		)
	}
}
