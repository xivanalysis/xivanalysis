import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {ActionKey} from 'data/ACTIONS'
import {JOBS, RoleKey} from 'data/JOBS'
import {ReactNode} from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {Utilities} from './UtilityActions'

const DEFENSIVE_ROLE_ACTIONS: Map<RoleKey, ActionKey[]> = new Map<RoleKey, ActionKey[]>([
	['TANK', ['RAMPART', 'REPRISAL']],
	['MELEE', ['FEINT', 'BLOODBATH', 'SECOND_WIND']],
	['PHYSICAL_RANGED', ['SECOND_WIND']],
	['MAGICAL_RANGED', ['ADDLE']],
	['HEALER', []],
])

export class Defensives extends Utilities {
	static override handle = 'defensives'
	static override title = msg({id: 'core.defensives.title', message: 'Defensives'})
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES

	/**
	 * Implementing modules may override the main header message text
	 */
	protected override headerContent: ReactNode = <Trans id="core.defensives.header.content">
		Using your mitigation and healing cooldowns can help you survive mistakes, or relieve some stress on the healers and let them deal more damage.<br/>
		While you shouldn't use them at the expense of your rotation or buff alignment, you should try to find helpful times to use them.
	</Trans>

	override initialise() {
		const roleDefensives = DEFENSIVE_ROLE_ACTIONS.get(JOBS[this.parser.actor.job].role)?.map(key => this.data.actions[key]) ?? []
		roleDefensives.forEach(roleAction => {
			if (!this.trackedActions.find(action => roleAction.id === action.id)) {
				this.trackedActions.push(roleAction)
			}
		})
	}
}
