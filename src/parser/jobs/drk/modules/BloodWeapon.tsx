import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import GlobalCooldown from 'parser/core/modules/GlobalCooldown'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const BLOOD_WEAPON_DURATION = 10000

const EXPECTED_CONSTANTS = {
	GCD: 5,
}

const SEVERITY_MISSED_GCDS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

class BloodWeaponState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	expectedGCDs: number = EXPECTED_CONSTANTS.GCD

	constructor(start: number) {
		this.start = start
	}

	get gcds(): number {
		return this.rotation
			.map(e => getDataBy(ACTIONS, 'id', e.ability.guid) as TODO)
			.filter(a => a && a.onGcd)
			.length
	}
}

export default class BloodWeapon extends Module {
	static handle = 'bloodweapon'
	static title = t('drk.bloodweapon.title')`Blood Weapon Usage`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private globalCooldown!: GlobalCooldown

	// Windows
	private bloodWeaponWindows: BloodWeaponState[] = []

	private get lastBloodWeapon(): BloodWeaponState | undefined {
		return _.last(this.bloodWeaponWindows)
	}

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook(
			'removebuff',
			{by: 'player', abilityId: STATUSES.BLOOD_WEAPON.id},
			this.onRemoveBloodWeapon,
		)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.BLOOD_WEAPON.id) {
			const bloodWeapon = new BloodWeaponState(event.timestamp)
			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			if ( BLOOD_WEAPON_DURATION >= fightTimeRemaining ) {
				// Rushing - end of fight, reduce expected number of skills
				const gcdEstimate = this.globalCooldown.getEstimate()
				const reducedWindow = Math.ceil((BLOOD_WEAPON_DURATION- fightTimeRemaining) / gcdEstimate)
				bloodWeapon.expectedGCDs -= reducedWindow
			}
			this.bloodWeaponWindows.push(bloodWeapon)
		}

		// So long as we're in this window, log our actions to it.
		const lastBloodWeapon = this.lastBloodWeapon
		if (lastBloodWeapon != null && lastBloodWeapon.end == null) {
			lastBloodWeapon.rotation.push(event)
		}
	}

	private onRemoveBloodWeapon(event: BuffEvent) {
		const lastDelirium = this.lastBloodWeapon

		if (lastDelirium != null) {
			lastDelirium.end = event.timestamp
		}
	}

	private onComplete() {
		const missedGcds = this.bloodWeaponWindows
			.reduce((sum, bloodWeaponWindow) => sum + Math.max(0, EXPECTED_CONSTANTS.GCD - bloodWeaponWindow.gcds), 0)

		// missed GCDs
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BLOOD_WEAPON.icon,
			content: <Trans id="drk.bloodweapon.suggestions.missedgcd.content">
				Try to land 5 GCDs during every <ActionLink {...ACTIONS.BLOOD_WEAPON}/> window. If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
			</Trans>,
			tiers: SEVERITY_MISSED_GCDS,
			value: missedGcds,
			why: <Trans id="drk.bloodweapon.suggestions.missedgcd.why">
				{missedGcds} <Plural value={missedGcds} one="GCD was" other="GCDs were"/> missed during Blood Weapon windows.
			</Trans>,
		}))
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <Trans id="drk.bloodweapon.table.header.gcds">GCDs</Trans>,
					accessor: 'gcd',
				},
			]}
			data={this.bloodWeaponWindows
				.map(bloodWeaponWindow => ({
					start: bloodWeaponWindow.start - this.parser.fight.start_time,
					end: bloodWeaponWindow.end != null ?
						bloodWeaponWindow.end - this.parser.fight.start_time
						: bloodWeaponWindow.start - this.parser.fight.start_time,
					targetsData: {
						gcd: {
							actual: bloodWeaponWindow.gcds,
							expected: bloodWeaponWindow.expectedGCDs,
						},
					},
					rotation: bloodWeaponWindow.rotation,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}

}
