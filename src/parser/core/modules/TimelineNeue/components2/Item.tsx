import React, {memo} from 'react'
import {Item as ItemConfig} from '../config'
import {useScale} from './ScaleHandler'
import styles from './Timeline.module.css'

export interface ItemsProps {
	items: ItemConfig[]
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
		{filteredItems.map((itemDetails) => (
			<Item
				item={items[itemDetails.index]}
				left={itemDetails.left}
				right={itemDetails.right}
			/>
		))}
	</>
})

interface ItemProps {
	item: ItemConfig
	left: number
	right: number
}

const Item = memo(function Item({
	item,
	left,
	right,
}: ItemProps) {
	return (
		<div
			className={styles.item}
			style={{left, width: right - left}}
		>
			<item.Content/>
		</div>
	)
})
