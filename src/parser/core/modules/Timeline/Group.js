export default class Group {
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
			nesterGroups: this.nesterGroups,
			showNested: this.showNested
		}
	}
}
