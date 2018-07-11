import React from 'react'
import {renderToString} from 'react-dom/server'

export default class Item {
	_end = null
	set end(value) {
		this._end = value
	}
	get end() {
		return this._end || this.start + this.length
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}

	// Need to provide a means for generating the final output so getters work
	// TODO: There's gotta be a better way right?
	getObject() {
		let content = this.content
		if (React.isValidElement(content)) {
			content = renderToString(content)
		}

		return {
			className: this.className,
			align: this.align,
			content,
			end: this.end,
			group: this.group,
			id: this.id,
			start: this.start,
			style: this.style,
			subgroup: this.subgroup,
			title: this.title,
			type: this.type,
			limitSize: this.limitSize,
			editable: this.editable,
		}
	}
}
