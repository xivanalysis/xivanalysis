import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Link} from 'react-router-dom'
import {Menu, Progress} from 'semantic-ui-react'
import {formatDuration} from 'utilities'

import styles from './FightItem.module.css'

class FightItem extends Component {
	static propTypes = {
		fight: PropTypes.shape({
			id: PropTypes.number.isRequired,
			kill: PropTypes.bool.isRequired,
			fightPercentage: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			start_time: PropTypes.number.isRequired,
			end_time: PropTypes.number.isRequired,
		}).isRequired,
		code: PropTypes.string.isRequired,
	}

	render() {
		const {
			id,
			kill, fightPercentage,
			start_time, end_time,
			name,
		} = this.props.fight

		const code = this.props.code

		const url = `/find/${code}/${id}/`
		const colour = kill? 'green' : 'red'
		const progress = Math.round(100 - (fightPercentage/100))
		const duration = Math.round((end_time - start_time)/1000)

		return <Menu.Item as={Link} to={url}>
			{name}
			<span className="pull-right">
				{formatDuration(duration)}
				{fightPercentage !== undefined && <Progress
					percent={progress}
					size="small"
					className={styles.progress}
					color={colour}
				/>}
			</span>
		</Menu.Item>
	}
}

export default FightItem
