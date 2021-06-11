import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import {CompleteEvent} from 'parser/core/Parser'
import React, {Fragment, ReactNode} from 'react'
import {Accordion} from 'semantic-ui-react'

type ThinAirRecord = {
	start: number,
	end: number,
	casts: CastEvent[],
	mpsaved: number,
}

export default class Thinair extends Module {
	static override handle = 'thinair'
	static override title = t('whm.thinair.title')`Thin Air`

	@dependency private data!: Data

	private active = false
	private history: ThinAirRecord[] = []
	private currentRecord: ThinAirRecord = {start: -1, end: -1, casts: [], mpsaved: 0}

	protected override init() {
		this.addEventHook('applybuff', {abilityId: STATUSES.THIN_AIR.id, by: 'player'}, this.onThinAirCast)
		this.addEventHook('removebuff', {abilityId: STATUSES.THIN_AIR.id, by: 'player'}, this.onThinAirRemove)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onThinAirCast(ev: BuffEvent) {
		this.startThinAir(ev.timestamp)
	}

	private onThinAirRemove(ev: BuffEvent) {
		this.stopAndSave(ev.timestamp)
	}

	private onCast(ev: CastEvent) {
		const actionid = ev.ability.guid

		if (actionid === ACTIONS.THIN_AIR.id) {
			this.startThinAir(ev.timestamp)
		}

		// Don't track autos
		const action = getDataBy(ACTIONS, 'id', actionid)
		if (!this.active || !action || action.autoAttack) {
			return
		}

		if (action.onGcd) {
			const mpcost = action.mpCost === undefined ? 0 : action.mpCost
			this.currentRecord.mpsaved += mpcost
		}

		// Save the event
		this.currentRecord.casts.push(ev)
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
	}

	private stopAndSave(timestamp: number) {
		if (!this.active) {
			return
		}

		this.active = false
		this.currentRecord.end = timestamp
		this.history.push(this.currentRecord)
	}

	private onComplete(ev: CompleteEvent) {
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
			const gcds = record.casts
				.map(cast => getDataBy(ACTIONS, 'id', cast.ability.guid))
				.filter(action => action && action.onGcd)
			const numGcds = gcds.length

			return {
				key: record.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(record.start)}
						<span> - </span>
						<Trans id="whm.thinair.rotation.gcd"><Plural value={numGcds} one="# GCD" other="# GCDs" /></Trans>, {record.mpsaved} MP saved
					</Fragment>,
				},
				content: {
					content: <Rotation events={record.casts}/>,
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
				The main use of <ActionLink {...ACTIONS.THIN_AIR} /> should be to save MP on high-MP cost phases of the fight. Don't be afraid to hold it and lose a use over the fight as long as it covers MP-heavy portions of the fight such as usages of <ActionLink {...ACTIONS.MEDICA_II}/>, <ActionLink {...ACTIONS.CURE_III}/> and <ActionLink {...ACTIONS.RAISE} />
			</Trans></p>
			{thinairDisplay}
		</Fragment>
	}
}
