import {Action} from 'data/ACTIONS'
import React, {ComponentType, ReactNode} from 'react'
import styles from './Item.module.css'

export interface Item {
	readonly start: number
	readonly end?: number
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

export class SimpleItem extends BaseItem {
	private readonly content: ReactNode

	constructor({content, ...opts}: {content?: ReactNode} & BaseItemOptions) {
		super(opts)
		this.content = content
	}

	Content = () => <>{this.content}</>
}

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
