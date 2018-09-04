import React, {Component} from 'react'
import {Container} from 'semantic-ui-react'

import ReportSearch from './ReportSearch'

import styles from './Home.module.css'

class Home extends Component {
	render() {
		return <>
			<div className={styles.background}></div>
			<Container className={styles.search}>
				<ReportSearch />
			</Container>
		</>
	}
}

export default Home
