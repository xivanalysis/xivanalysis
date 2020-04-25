import classNames from 'classnames'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import React, {ComponentType, ReactNode} from 'react'
import styles from './Item.module.css'

export interface Item {
	/** Start time of the item */
	readonly start: number
	/** End time of the item */
	readonly end: number
	/** Component to render as the item */
	readonly Content: ComponentType
}

interface BaseItemOptions {
	start: number
	end: number
}

abstract class BaseItem implements Item {
	readonly start: number
	readonly end: number

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

// Heh. Hiding this 'cus I hate calling stuff an ability
// Also maybe we wanna change UIs later iuno
class AbilityItem extends BaseItem {
	private readonly ability: Action | Status

	constructor({ability, ...opts}: {ability: Action | Status} & BaseItemOptions) {
		super(opts)
		this.ability = ability
	}

	Content = () => (
		<div className={classNames(
			styles.abilityItem,
			// start === end is invisible, allow it to overflow
			this.start === this.end && styles.zeroWidthAbility,
		)}>
			<img
				src={this.ability.icon}
				alt={this.ability.name}
				title={this.ability.name}
			/>
		</div>
	)
}

/** Pre-fabricated item representing an action. */
export class ActionItem extends AbilityItem {
	constructor({action, ...opts}: {action: Action} & BaseItemOptions) {
		super({...opts, ability: action})
	}
}

/** Pre-fabricated item representing a status */
export class StatusItem extends AbilityItem {
	constructor({status, ...opts}: {status: Status} & BaseItemOptions) {
		super({...opts, ability: status})
	}
}
