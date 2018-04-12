import React, { Component, Fragment } from 'react'

import DbLink from '@/ui/DbLink'

class Home extends Component {
	render() {
		return (
			<Fragment>
				Home page
				<DbLink obj={{type: 'item', id: 16054, name: 'Terpander Lux'}}/>
			</Fragment>
		)
	}
}

export default Home
