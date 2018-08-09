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
