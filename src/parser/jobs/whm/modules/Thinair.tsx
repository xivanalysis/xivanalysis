import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import React, {Fragment, ReactNode} from 'react'
import {Accordion} from 'semantic-ui-react'

interface ThinAirRecord {
	start: number,
	end: number,
	casts: number[],
	mpsaved: number,
}

export class Thinair extends Analyser {
	static override handle = 'thinair'
	static override title = t('whm.thinair.title')`Thin Air`

	private active = false
	private history: ThinAirRecord[] = []
	private currentRecord: ThinAirRecord = {start: -1, end: -1, casts: [], mpsaved: 0}

	override initialise() {
		const thinairFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(STATUSES.THIN_AIR.id)

		this.addEventHook(thinairFilter.type('statusApply'), this.onThinAirCast)
		this.addEventHook(thinairFilter.type('statusRemove'), this.onThinAirRemove)
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onThinAirCast(ev: Events['statusApply']) {
		this.startThinAir(ev.timestamp)
	}

	private onThinAirRemove(ev: Events['statusRemove']) {
		this.stopAndSave(ev.timestamp)
	}

	private onCast(ev: Events['action']) {
		const actionid = ev.action

		// Don't track autos
		const action = getDataBy(ACTIONS, 'id', actionid)
		if (!this.active || !action || action.autoAttack) {
			return
		}

		if (action.mpCost) {
			this.currentRecord.mpsaved += action.mpCost
		}

		// Save the event
		this.currentRecord.casts.push(ev.action)
	}

	private startThinAir(timestamp: number) {
		// Ignore if we are already active
		if (this.active) {
			return
		}

		this.active = true
		this.currentRecord = {
			start: timestamp,
			end: -1,
			casts: [],
			mpsaved: 0,
		}

		// Add thin air action as the 1st element for cosmetic reasons
		// and keeping in style with astro's lightspeed module
		this.currentRecord.casts.push(ACTIONS.THIN_AIR.id)
	}

	private stopAndSave(timestamp: number) {
		if (!this.active) {
			return
		}

		this.active = false
		this.currentRecord.end = timestamp
		this.history.push(this.currentRecord)
	}

	private onComplete(ev: Events['complete']) {
		if (this.active) {
			this.stopAndSave(ev.timestamp)
		}
	}

	override output(): ReactNode {
		const casts = this.history.length
		if (casts === 0) {
			return <Fragment>
				<p><span><Trans id="whm.thinair.messages.no-casts">No casts recorded for <ActionLink {...ACTIONS.THIN_AIR}/></Trans></span></p>
			</Fragment>
		}

		const panels = this.history.map(record => {
			const actions = record.casts.map(action => getDataBy(ACTIONS, 'id', action)).filter(x => !!x)
			const gcds = actions.filter(action => action && action.onGcd)
			const numGcds = gcds.length

			return {
				key: record.start,
				title: {
					content: <Fragment>
						{this.parser.formatEpochTimestamp(record.start)}
						<span> - </span>
						<Trans id="whm.thinair.rotation.gcd"><Plural value={numGcds} one="# GCD" other="# GCDs" /></Trans>, {record.mpsaved} MP saved
					</Fragment>,
				},
				content: {
					content: <Rotation events={record.casts.map(x => ({action: x}))}/>,
				},
			}
		})

		const thinairDisplay = <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		></Accordion>

		return <Fragment>
			<p><Trans id="whm.thinair.messages.explanation">
				The main use of <ActionLink {...ACTIONS.THIN_AIR} /> should be to save MP on high-MP cost phases of the fight. Don't be afraid to hold it and lose a use over the fight as long as it covers MP-heavy portions of the fight such as usages of <ActionLink {...ACTIONS.MEDICA_II}/>, <ActionLink {...ACTIONS.CURE_III}/>, and <ActionLink {...ACTIONS.RAISE} />
			</Trans></p>
			{thinairDisplay}
		</Fragment>
	}
}
