import React, { Component } from 'react'

class ReportSearch extends Component {
	static getCode(input) {
		const match = input.match(/^(?:.*reports\/)?([a-zA-Z0-9]{16})\/?(?:#.*)?$/)
		return match && match[1]
	}

	static getFight(input) {
		const match = input.match(/fight=([^&]*)/)
		return match && match[1]
	}

	static getPlayer(input) {
		const match = input.match(/source=([^&]*)/)
		return match && match[1]
	}

	constructor(props) {
		super(props)
		this.inputField = React.createRef()
	}

	// Using arrow function to maintain bind
	parseReportUrl = () => {
		const input = this.inputField.current.value.trim()

		const code = this.constructor.getCode(input)
		const fight = this.constructor.getFight(input)
		const player = this.constructor.getPlayer(input)

		let url = '/'
		if (code) {
			url += `${code}/`

			if (fight) {
				url += `${fight}/`

				if (player) {
					url += `${player}/`
				}
			}

			url = ((fight && player)? 'analyse' : 'find') + url
		}

		console.log(url)
	}

	render() {
		return (
			<div className="input-group">
				<input
					type="text"
					className="form-control"
					placeholder="https://www.fflogs.com/reports/..."
					ref={this.inputField}
					onChange={this.parseReportUrl}
				/>
				<div className="input-group-append">
					<button type="button" className="btn btn-outline-primary" onClick={this.parseReportUrl}>
						Analyse
					</button>
				</div>
			</div>
		)
	}
}

export default ReportSearch
