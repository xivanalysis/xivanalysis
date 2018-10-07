const DEFAULT_GROUP_ORDER = 50

export default class Group {
	order = DEFAULT_GROUP_ORDER

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}

	// Need to provide a means for generating the final output so getters work
	getObject() {
		return {
			className: this.className,
			content: this.content,
			id: this.id,
			style: this.style,
			subgroupOrder: this.subgroupOrder,
			subgroupStack: this.subgroupStack,
			title: this.title,
			visible: this.visible,
			nestedGroups: this.nestedGroups,
			showNested: this.showNested,
			order: this.order,
		}
	}
}

export class ItemGroup extends Group {
	_items = []
	get items() {
		return this._items
	}

	_visible = null
	set visible(value) {
		this._visible = value
	}
	get visible() {
		if (this._visible !== null) {
			return this._visible
		}

		const hasNested = this.nestedGroups && this.nestedGroups.length
		// Needs to be bool or vis doesn't like it
		return !!(hasNested || this._items.length)
	}

	addItem(item) {
		item.group = this.id
		this._items.push(item)
	}
}
