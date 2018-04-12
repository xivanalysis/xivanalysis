import React, { Component } from 'react'

import DbLink from '../ui/DbLink'

class Home extends Component {
	render() {
		return (
			<div>
				Home page
				<DbLink obj={{type: 'item', id: 16054, name: 'Terpander Lux'}}/>
			</div>
		)
	}
}

export default Home
