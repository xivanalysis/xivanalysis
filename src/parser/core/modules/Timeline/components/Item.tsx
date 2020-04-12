import React, {memo, ReactNode} from 'react'
import {Item as ItemConfig} from '../config'
import {useScales} from './ScaleHandler'
import styles from './Timeline.module.css'

export interface ItemsProps {
	items: readonly ItemConfig[]
}

export const Items = memo(function Items({
	items,
}: ItemsProps) {
	const scales = useScales()

	// Calculate the positions of the items, and cull any that fall entirely outside
	// the current visible range. This isn't memo'd, as realistically almost every
	// render pass will need to re-calculate this.
	const [min, max] = scales.extended.domain().map(t => t.getTime())
	const filteredItems = []
	for (const [index, item] of items.entries()) {
		if (item.start > max || item.end < min) {
			continue
		}
		filteredItems.push({
			index,
			left: scales.primary(item.start),
			right: scales.primary(item.end),
		})
	}

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
