import classNames from 'classnames'
import React from 'react'
import styles from './List.module.css'

// If someone can work out magic to generic this w/ React.ReactType that'd be awesome
// Semantic doesn't so I gave up.
interface ListItemProps {
	background?: string
	color?: string
	as?: React.ReactType
	[key: string]: any
}

class ListItem extends React.PureComponent<ListItemProps> {
	render() {
		const {
			background,
			color,
			as: Component = 'div',
			children,
			...props
		} = this.props

		return (
			<Component
				{...props}
				className={classNames(
					styles.listItem,
					props.className,
				)}
				style={{
					background,
					color,
					...props.style,
				}}
			>
				{children}
			</Component>
		)
	}
}

interface ListProps {
	title?: React.ReactNode,
	color?: string,
}

export class List extends React.PureComponent<ListProps> {
	static Item = ListItem

	render() {
		const {color, children} = this.props

		return (
			<div
				className={styles.list}
				style={{borderColor: color}}
			>
				{children}
			</div>
		)
	}
}
