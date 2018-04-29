import React, { Component } from 'react'
import { Container } from 'semantic-ui-react'

import ReportSearch from './ReportSearch'

class Home extends Component {
	render() {
		return <Container>
			<ReportSearch/>
		</Container>
	}
}

export default Home
