import React, { Component } from 'react'

import ReportSearch from '@/ui/ReportSearch'
import DbLink from '@/ui/DbLink'

class Home extends Component {
	render() {
		return (
			<div className="container">
				<ReportSearch/>

				<DbLink obj={{type: 'item', id: 16054, name: 'Terpander Lux'}}/>
			</div>
		)
	}
}

export default Home
