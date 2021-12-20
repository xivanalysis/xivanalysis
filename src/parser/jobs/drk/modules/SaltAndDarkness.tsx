import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isSuccessfulHit} from 'utilities'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SEVERITIES = {
	UNUSED: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	FAILED: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
}

export class SaltAndDarkness extends Analyser {
	static override handle = 'saltanddarkness'
	static override title = t('drk.saltanddarkness.title')`Salt And Darkness`
	static override displayOrder = DISPLAY_ORDER.RESOURCES

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private saltedEarthUsed = 0
	private saltAndDarknessUsed = 0
	private saltAndDarknessDamaged = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.SALTED_EARTH.id), () => this.saltedEarthUsed++)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.SALT_AND_DARKNESS.id), () => this.saltAndDarknessUsed++)
		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseAction(['SALT_AND_DARKNESS'])), this.onSaltDarknessDamage)
		this.addEventHook('complete', this.onComplete)
	}

	private onSaltDarknessDamage(event: Events['damage']) {
		if (isSuccessfulHit(event)) {
			this.saltAndDarknessDamaged++
		}
	}

	private onComplete() {
		const unused = this.saltedEarthUsed - this.saltAndDarknessUsed
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SALT_AND_DARKNESS.icon,
			content: <Trans id="drk.saltanddarkness.unused.content">
				Use <DataLink action="SALT_AND_DARKNESS" /> every time you use <DataLink action="SALTED_EARTH" /> in order to do additional damage to enemies inside the <DataLink action="SALTED_EARTH" /> area of effect.
			</Trans>,
			tiers: SEVERITIES.UNUSED,
			value: unused,
			why: <Trans id="drk.saltanddarkness.unused.why">
				You did not use <DataLink action="SALT_AND_DARKNESS" showTooltip={false} showIcon={false} /> after <DataLink action="SALTED_EARTH" showTooltip={false} showIcon={false} /> <Plural value={unused} one="# time" other="# times" />.
			</Trans>,
		}))

		const failed = this.saltAndDarknessUsed - this.saltAndDarknessDamaged
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SALT_AND_DARKNESS.icon,
			content: <Trans id="drk.saltanddarkness.failed.content">
				Use <DataLink action="SALT_AND_DARKNESS" /> only when there are enemies inside the effect area of <DataLink action="SALTED_EARTH" /> and those enemies are not invulnerable.
			</Trans>,
			tiers: SEVERITIES.UNUSED,
			value: failed,
			why: <Trans id="drk.saltanddarkness.failed.why">
				<Plural value={failed} one="# use" other="# uses" /> of <DataLink action="SALT_AND_DARKNESS" showTooltip={false} showIcon={false} /> did no damage due to enemies being invulnerable or not being in the <DataLink action="SALTED_EARTH" showTooltip={false} showIcon={false} /> area of effect.
			</Trans>,
		}))
	}
}
