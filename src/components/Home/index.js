import React, { Component } from 'react'

import ReportSearch from './ReportSearch'
import styles from './Home.module.css'

class Home extends Component {
	render() {
		return <div className="home">
			<div className={styles.searchBox}>
				<div className={`container ${styles.search}`}>
					<ReportSearch/>
				</div>
			</div>
			<p>
				TODO: Needs something here
			</p>
		</div>
	}
}

export default Home
