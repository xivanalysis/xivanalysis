import React, {memo, ReactNode} from 'react'
import {Item as ItemConfig} from '../config'
import {useScale} from './ScaleHandler'
import styles from './Timeline.module.css'

export interface ItemsProps {
	items: readonly ItemConfig[]
}

export const Items = memo(function Items({
	items,
}: ItemsProps) {
	const scale = useScale()
	const [min, max] = scale.range()

	// Calculate the positions of the items, and cull any that fall entirely outside
	// the current visible range
	const filteredItems = items
		.map((item, index) => ({
			index,
			left: scale(item.start),
			right: scale(item.end),
		}))
		.filter(detail =>
			detail.right >= min &&
			detail.left <= max,
		)

	return <>
		{filteredItems.map((itemDetails) => {
			const {Content} = items[itemDetails.index]
			return (
				<Item key={itemDetails.index} left={itemDetails.left} right={itemDetails.right}>
					<Content/>
				</Item>
			)
		})}
	</>
})

export interface ItemProps {
	children?: ReactNode,
	left: number
	right?: number
}

export const Item = memo(function Item({
	children,
	left,
	right,
}: ItemProps) {
	return (
		<div
			className={styles.item}
			style={{
				left,
				width: right != null ? right - left : undefined,
			}}
		>
			{children}
		</div>
	)
})
