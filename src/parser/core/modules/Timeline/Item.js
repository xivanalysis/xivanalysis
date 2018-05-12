export default class Item {
	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}

	// Need to provide a means for generating the final output so getters work
	// TODO: There's gotta be a better way right?
	getObject() {
		return {
			className: this.className,
			align: this.align,
			content: this.content,
			end: this.end,
			group: this.group,
			id: this.id,
			start: this.start,
			style: this.style,
			subgroup: this.subgroup,
			title: this.title,
			type: this.type,
			limitSize: this.limitSize,
			editable: this.editable
		}
	}
}
