import React, {Fragment} from 'react'

import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'

const DPS_COOLDOWNS_TRACKED = [ACTIONS.ASSIZE, ACTIONS.PRESENCE_OF_MIND]
const DPS_TARGET_PERCENT = 75
const OTHER_COOLDOWNS_TRACKED = [ACTIONS.ASYLUM, ACTIONS.DIVINE_BENISON, ACTIONS.PLENARY_INDULGENCE, ACTIONS.TEMPERANCE]

const OTHER_ALLOWED_MISSES = {
	[ACTIONS.ASYLUM.id]: {
		minor: 2,
		medium: 3,
		major: Infinity,
		showHeld: false,
		content: <Fragment>
			<Trans id="whm.ogcds.suggestions.asylum.content">Use <ActionLink {...ACTIONS.ASYLUM}/> frequently in an encounter whenever party members will be close enough to stand in the bubble. For instances where members are frequently spread too far, Asylum can still be used for tank healing.</Trans>
		</Fragment>,
	},
	[ACTIONS.DIVINE_BENISON.id]: {
		minor: 8,
		medium: 12,
		major: 0,
		showHeld: true,
		content: <Fragment>
			<Trans id="whm.ogcds.suggestions.divine_benison.content">Weave <ActionLink {...ACTIONS.DIVINE_BENISON}/> as often as possible to minimize single target healing needed. However, it is not worth clipping to apply a benison. Do not hold Divine Benison for tank busters. Since Dia's duration is 30s, try to weave Divine Benison with every Dia that you don't have two more important weaves to execute.</Trans>
		</Fragment>,
	},
	[ACTIONS.PLENARY_INDULGENCE.id]: {
		minor: 1,
		medium: 0,
		major: 0,
		showHeld: false,
		content: <Fragment>
			<Trans id="whm.ogcds.suggestions.plenary_indulgence.content">Use <ActionLink {...ACTIONS.PLENARY_INDULGENCE}/> when casting GCD AOE heals when the extra potency will reduce the amount of additional heals needed. Avoiding clipping to apply this, and only consider clipping if the additional healing will save subsequent a GCD heal cast.</Trans>
		</Fragment>,
	},
	[ACTIONS.TEMPERANCE.id]: {
		minor: 2,
		medium: 3,
		major: 0,
		showHeld: false,
		content: <Fragment>
			<Trans id="whm.ogcds.suggestions.temperance.content">Use <ActionLink {...ACTIONS.TEMPERANCE}/> often to mitigate incoming raid damage and boost GCD healing potency. Avoid clipping to apply it.</Trans>
		</Fragment>,
	},
}

interface CooldownTrack {
	held: number,
	lastUsed: number,
	uses: number,
}

interface CooldownTrackCollection {
	[id: number]: CooldownTrack | undefined
}

export default class OGCDs extends Module {
	static handle = 'oGCDs'
	static title = t('whm.ogcds.title')`Off Global Cooldowns`

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private cooldownUsage: CooldownTrackCollection = {}
	private castFilter: number[] = []
	private spellCooldowns: {[id: number]: number} = {}

	protected init() {
		this.initSpellCooldowns()
		this.initCastFilter()
		this.initCooldownUsage()

		this.addEventHook('cast', {by: 'player', abilityId: this.castFilter}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private initSpellCooldowns() {
		this.spellCooldowns = [...DPS_COOLDOWNS_TRACKED, ...OTHER_COOLDOWNS_TRACKED].reduce((obj, action) => {
			obj[action.id] = action.cooldown * 1000
			return obj
		}, this.spellCooldowns)
	}

	private initCastFilter() {
		this.castFilter = [...DPS_COOLDOWNS_TRACKED, ...OTHER_COOLDOWNS_TRACKED].map(act => act.id)
	}

	private getCooldownUsage(id: number) {
		return this.cooldownUsage[id] ?? {held: 0, lastUsed: this.parser.fight.start_time, uses: 0}
	}

	private initCooldownUsage() {
		this.cooldownUsage = [...DPS_COOLDOWNS_TRACKED, ...OTHER_COOLDOWNS_TRACKED].reduce((obj, action) => {
			obj[action.id] = {
				held: 0,
				lastUsed: this.parser.fight.start_time,
				uses: 0,
			}
			return obj
		}, this.cooldownUsage)
	}

	private calculateHeldTime(timestamp: number, lastUsed: number, cooldownTime: number) {
		const held = timestamp - lastUsed - cooldownTime
		return Math.max(0, held)
	}

	private onCast(event: CastEvent) {
		const id = event.ability.guid
		const cooldownUsage = this.getCooldownUsage(id)
		cooldownUsage.uses++

		cooldownUsage.held += this.calculateHeldTime(event.timestamp, cooldownUsage.lastUsed, this.spellCooldowns[id])
		cooldownUsage.lastUsed = event.timestamp
		this.cooldownUsage[id] = cooldownUsage
	}

	private onComplete() {
		const pullDuration = this.parser.fight.end_time - this.parser.fight.start_time
		const requirements = DPS_COOLDOWNS_TRACKED.map(action => new Requirement({
			name: <ActionLink {...action}/>,
			value: this.getCooldownUsage(action.id).uses,
			target: Math.ceil(this.parser.currentDuration / (action.cooldown * 1000)),
		}))

		this.checklist.add(new Rule({
			name: <Trans id="whm.ogcds.checklist.name">Use your offensive OGCDs</Trans>,
			description: <Trans id="whm.ogcds.content">
				Use these skills as often as possible during an encounter to maximize DPS. However, avoiding clipping to use them.
				Assize may be able to be held to efficiently heal and deal damage if you can do so without losing a use in the fight,
				but be cautious of creating alignment and clipping issues.
			</Trans>,
			target: DPS_TARGET_PERCENT,
			requirements,
		}))

		OTHER_COOLDOWNS_TRACKED.forEach(action => {

			const cooldownUsage = this.getCooldownUsage(action.id)
			// calculate final held amount
			cooldownUsage.held += this.calculateHeldTime(this.parser.currentTimestamp, cooldownUsage.lastUsed, this.spellCooldowns[action.id])
			// set up for suggestion(s)
			const maxUses = Math.ceil(this.parser.currentDuration / (action.cooldown * 1000))
			const uses = cooldownUsage.uses
			const held = cooldownUsage.held
			const showHeld = OTHER_ALLOWED_MISSES[action.id].showHeld
			const missed = maxUses - uses
			const severities = OTHER_ALLOWED_MISSES[action.id]

			if (missed > OTHER_ALLOWED_MISSES[action.id].minor) {
				let severity: number = SEVERITY.MINOR

				if (severities.major === Infinity && uses === 0) {
					severity = SEVERITY.MAJOR
				} else if (severities.major !== 0 && missed >= severities.major) {
					severity = SEVERITY.MAJOR
				} else if (severities.medium !== 0 && missed >= severities.medium) {
					severity = SEVERITY.MEDIUM
				}

				const why = <Fragment>
					<Trans id="whm.ogcds.suggestions.why">
						You missed about {missed} out of a possible {maxUses} casts.
					</Trans>
				</Fragment>

				const whyHeld = <Fragment>
					<Trans id="whm.ogcds.suggestions.whyHeld">
						You missed about {missed} out of a possible {maxUses} casts because you held this cooldown for a total of {this.parser.formatDuration(held)}.
					</Trans>
				</Fragment>

				this.suggestions.add(new Suggestion({
					icon: action.icon,
					content: OTHER_ALLOWED_MISSES[action.id].content,
					why: showHeld ? whyHeld : why,
					severity,
				}))
			}
		})
	}
}
