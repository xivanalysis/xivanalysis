import {Action} from 'data/ACTIONS'
import React, {ComponentType, ReactNode} from 'react'
import styles from './Item.module.css'

export interface Item {
	/** Start time of the item */
	readonly start: number
	/** End time of the item */
	readonly end?: number
	/** Component to render as the item */
	readonly Content: ComponentType
}

interface BaseItemOptions {
	start: number
	end?: number
}

abstract class BaseItem implements Item {
	readonly start: number
	readonly end?: number

	abstract Content: ComponentType

	constructor(opts: BaseItemOptions) {
		this.start = opts.start
		this.end = opts.end
	}
}

/**
 * Simple item that can be added to the timeline. You are expected to provide
 * your own content to visualise.
 */
export class SimpleItem extends BaseItem {
	private readonly content: ReactNode

	constructor({content, ...opts}: {content?: ReactNode} & BaseItemOptions) {
		super(opts)
		this.content = content
	}

	Content = () => <>{this.content}</>
}

/** Pre-fabricated item representing an action. */
export class ActionItem extends BaseItem {
	private readonly action: Action

	constructor({action, ...opts}: {action: Action} & BaseItemOptions) {
		super(opts)
		this.action = action
	}

	Content = () => (
		<div className={styles.actionItem}>
			<img
				src={this.action.icon}
				alt={this.action.name}
				title={this.action.name}
			/>
		</div>
	)
}
