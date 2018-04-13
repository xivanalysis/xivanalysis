import React, { Component, Fragment } from 'react'

import ReportSearch from '@/ui/ReportSearch'
import DbLink from '@/ui/DbLink'

class Home extends Component {
	render() {
		return (
			<Fragment>
				<ReportSearch/>

				<DbLink obj={{type: 'item', id: 16054, name: 'Terpander Lux'}}/>
			</Fragment>
		)
	}
}

export default Home
