import React, { Component } from 'react'

class ReportSearch extends Component {
	render() {
		return (
			<div className="input-group">
				<input type="text" className="form-control" placeholder="https://www.fflogs.com/reports/..."/>
				<div className="input-group-append">
					<button type="button" className="btn btn-outline-primary">Analyse</button>
				</div>
			</div>
		)
	}
}

export default ReportSearch
