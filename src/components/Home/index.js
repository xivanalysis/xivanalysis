import React, { Component, Fragment } from 'react'
import { Container } from 'semantic-ui-react'

import ReportSearch from './ReportSearch'
import styles from './Home.module.css'

class Home extends Component {
	render() {
		return <Fragment>
			<div className={styles.searchBox}>
				<Container className={styles.search}>
					<ReportSearch/>
				</Container>
			</div>
			<p>TODO: Needs something here</p>
		</Fragment>
	}
}

export default Home
