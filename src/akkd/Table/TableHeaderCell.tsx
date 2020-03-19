import classNames from 'classnames'
import React from 'react'
import styles from './Table.module.css'

interface ListItemProps {
	className?: string,
	textAlign?: any,
	collapsing?: boolean,
	[key: string]: any,
}

export class TableHeaderCell extends React.PureComponent<ListItemProps> {
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
			children,
			...props
		} = this.props

		return (
			<th align={textAlign}
				{...props}
				className={classNames(
					collapsing && styles.collapsing,
					this.textAlignment(textAlign),
					className,
				)}>
				{children}
			</th>
		)
	}
}
