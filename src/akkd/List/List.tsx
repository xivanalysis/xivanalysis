import classNames from 'classnames'
import {ElementType, PureComponent, ReactNode} from 'react'
import styles from './List.module.css'

// If someone can work out magic to generic this w/ React.ReactType that'd be awesome
// Semantic doesn't so I gave up.
interface ListItemProps {
	as?: ElementType
	className?: string
	[key: string]: unknown
	children?: ReactNode
}

class ListItem extends PureComponent<ListItemProps> {
	override render() {
		const {
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
			>
				{children}
			</Component>
		)
	}
}

interface ListProps {
	title?: ReactNode,
	color?: string,
	children?: ReactNode
}

export class List extends PureComponent<ListProps> {
	static Item = ListItem

	override render() {
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
