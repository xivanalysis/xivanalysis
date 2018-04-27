import React, { Component } from 'react'

import ReportSearch from 'components/ui/ReportSearch'
import DbLink from 'components/ui/DbLink'

class Home extends Component {
	render() {
		return (
			<div className="container">
				<ReportSearch/>

				<DbLink {...{type: 'item', id: 16054, name: 'Terpander Lux'}}/>
			</div>
		)
	}
}

export default Home
