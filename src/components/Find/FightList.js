import {Trans} from '@lingui/react'
import {inject, observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Checkbox, Header, Icon, Menu} from 'semantic-ui-react'

import FightItem from './FightItem'
import ZONES from 'data/ZONES'
import {ReportStore} from 'storenew/report'
import {SettingsStore} from 'storenew/settings'

import styles from './FightList.module.css'

@inject('reportStore', 'settingsStore')
@observer
class FightList extends Component {
	static propTypes = {
		reportStore: PropTypes.instanceOf(ReportStore),
		settingsStore: PropTypes.instanceOf(SettingsStore),
	}

	refreshFights = () => {
		const {reportStore} = this.props
		reportStore.refreshReport()
	}

	onToggleKillsOnly = (_, data) => {
		const {settingsStore} = this.props
		settingsStore.setViewKillsOnly(data.checked)
	}

	render() {
		const {
			reportStore,
			settingsStore,
		} = this.props

		const report = reportStore.report

		// Build a 2d array, grouping fights by the zone they take place in
		const fights = []
		let lastZone = null

		const trashFights = []

		report.fights && report.fights.forEach(fight => {
			// Group all trash together in case they want to see it
			if (fight.boss === 0) {
				trashFights.push(fight)
				return
			}

			// Filter out wipes if we're filtering
			if (settingsStore.killsOnly && !fight.kill) {
				return
			}

			// If this is a new zone, add a new grouping
			if (fight.zoneID !== lastZone) {
				fights.push({
					zone: {
						...ZONES[fight.zoneID],
						name: fight.zoneName,
					},
					fights: [],
				})
				lastZone = fight.zoneID
			}

			// Add the fight to the current grouping
			fights[fights.length-1].fights.push(fight)
		})

		// If there are any trash fights, add them in now
		if (trashFights.length) {
			fights.push({
				zone: {
					...ZONES._TRASH,
					name: <Trans id="core.find.trash">Trash</Trans>,
				},
				fights: trashFights,
			})
		}

		return <>
			<Header>
				<Trans id="core.find.select-pull">
					Select a pull
				</Trans>
				<div className="pull-right">
					<Checkbox
						toggle
						label={<label><Trans id="core.find.kills-only">Kills only</Trans></label>}
						defaultChecked={settingsStore.killsOnly}
						onChange={this.onToggleKillsOnly}
					/>
					<span className={styles.refresh} onClick={this.refreshFights}>
						<Icon name="refresh"/>
						<Trans id="core.find.refresh">
							Refresh
						</Trans>
					</span>
				</div>
			</Header>

			{fights.map((group, index) => <Fragment key={index}>
				<Header
					attached="top"
					inverted
					className={group.zone.banner && styles.groupHeader}
				>
					{group.zone.banner && <div
						className={styles.groupHeaderBackground}
						style={{backgroundImage: `url(${group.zone.banner})`}}
					/>}
					{group.zone.name}
				</Header>
				<Menu attached="bottom" fluid vertical>
					{group.fights.map(fight => <FightItem key={fight.id} fight={fight} code={report.code}/>)}
				</Menu>
			</Fragment>)}
		</>
	}
}

export default FightList
