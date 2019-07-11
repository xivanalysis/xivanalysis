import {Trans} from '@lingui/react'
import {getCorrectedFight, getZoneBanner} from 'data/BOSSES'
import {observer} from 'mobx-react'
import React, {Component, Fragment} from 'react'
import {Checkbox, Header, Icon, Menu} from 'semantic-ui-react'
import {StoreContext} from 'store'
import FightItem from './FightItem'
import styles from './FightList.module.css'

@observer
class FightList extends Component {
	static contextType = StoreContext

	refreshFights = () => {
		const {reportStore} = this.context
		reportStore.refreshReport()
	}

	onToggleKillsOnly = (_, data) => {
		const {settingsStore} = this.context
		settingsStore.setViewKillsOnly(data.checked)
	}

	render() {
		const {
			reportStore,
			settingsStore,
		} = this.context

		const report = reportStore.report

		// Build a 2d array, grouping fights by the zone they take place in
		const fights = []
		let lastZone

		const trashFights = []

		report.fights && report.fights.forEach(rawFight => {
			// Run corrections on the data
			const fight = getCorrectedFight(rawFight)

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
						id: fight.zoneID,
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
				zone: {name: <Trans id="core.find.trash">Trash</Trans>},
				fights: trashFights,
			})
		}

		return <div className={styles.fightList}>
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
					className={group.zone.id && styles.groupHeader}
				>
					{group.zone.id && <div
						className={styles.groupHeaderBackground}
						style={{backgroundImage: `url(${getZoneBanner(group.zone.id)})`}}
					/>}
					{group.zone.name}
				</Header>
				<Menu attached="bottom" fluid vertical>
					{group.fights.map(fight => <FightItem key={fight.id} fight={fight} code={report.code}/>)}
				</Menu>
			</Fragment>)}
		</div>
	}
}

export default FightList
