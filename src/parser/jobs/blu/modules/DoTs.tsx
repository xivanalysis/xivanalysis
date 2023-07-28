import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, TARGET, Rule} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	UNBUFFED_SOT: {
		1: SEVERITY.MINOR,
	},
	// Clipping warnings in seconds per minute
	CLIPPING: {
		6000: SEVERITY.MINOR,
		9000: SEVERITY.MEDIUM,
		12000: SEVERITY.MAJOR,
	},
	UPTIME: {
		90: TARGET.WARN,
		95: TARGET.SUCCESS,
	},
}

export class DoTs extends CoreDoTs {
	@dependency private myactors!: Actors
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private bristleId?: Status['id']
	private unbuffedSongsOfTorment = 0
	private unbuffedBoM = 0
	private unbuffedMortal = 0

	protected override trackedStatuses = [
		this.data.statuses.BLEEDING.id,
		this.data.statuses.BREATH_OF_MAGIC.id,
		this.data.statuses.MORTAL_FLAME.id,
	]

	override initialise() {
		super.initialise()

		this.bristleId = this.data.statuses.BRISTLE.id

		const playerActionFilter = filter<Event>().source(this.parser.actor.id).type('action')

		this.addEventHook(playerActionFilter.action(this.data.actions.SONG_OF_TORMENT.id), this.onApplyingSoT)
		this.addEventHook(playerActionFilter.action(this.data.actions.BREATH_OF_MAGIC.id), this.onApplyingBoM)
		this.addEventHook(playerActionFilter.action(this.data.actions.MORTAL_FLAME.id), this.onApplyingMortalFlame)
		this.addEventHook(filter<Event>().type('complete'), this.onCompleteExtra)

	}
	private onApplyingSoT() {
		if (this.bristleId === undefined) { return }
		if (this.myactors.current.hasStatus(this.bristleId)) { // Boost effect from Bristle is present
			return
		}

		// Bristle was not used, which is a (relatively minor) ~65 potency loss
		this.unbuffedSongsOfTorment++
	}

	private onApplyingBoM() {
		if (!this.myactors.current.hasStatus(this.data.statuses.BRISTLE.id)) {
			this.unbuffedBoM++
			return
		}
		if (!this.myactors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id)) {
			this.unbuffedBoM++
		}
	}

	private onApplyingMortalFlame() {
		if (!this.myactors.current.hasStatus(this.data.statuses.BRISTLE.id)) {
			this.unbuffedMortal++
			return
		}
		if (!this.myactors.current.hasStatus(this.data.statuses.WAXING_NOCTURNE.id)) {
			this.unbuffedMortal++
		}
	}
	private unbuffedBigDoTWhy(unbuffedBoM: number, unbuffedMortal: number): JSX.Element {
		if (unbuffedBoM && unbuffedMortal) {
			// Both BoM and Mortal Flame were unbuffed
			return <Trans id ="blu.big-dots.suggestion.unbuffed.why">
				<Plural value={this.unbuffedBoM} one="# Breath of Magic" other="# Breaths of Magic"/> and
				<Plural value={this.unbuffedMortal} one=" # Mortal Flame" other=" # Mortal Flames"/> were cast without both buffs.
			</Trans>
		}

		if (unbuffedBoM) {
			// unbuffed Breath of Magic
			return <Trans id ="blu.breath_of_magic.suggestion.unbuffed.why">
				<Plural value={this.unbuffedBoM} one="# Breath of Magic was" other="# Breaths of Magic were"/> cast without both buffs.
			</Trans>
		}

		// unbuffed Mortal Flame
		return <Trans id ="blu.mortal_flame.suggestion.unbuffed.why">
			<Plural value={this.unbuffedMortal} one="# Mortal Flame was" other="# Mortal Flames were"/> cast without both buffs.
		</Trans>
	}

	private onCompleteExtra() {
		// TODO: For the Breath of Magic applier, one of their Songs of Torment will be reapplied
		// under Moon Flute, so they SHOULD be Bristling it.
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SONG_OF_TORMENT.icon,
			content: <Trans id = "blu.song_of_torment.suggestion.unbuffed.content">
				Ideally every <DataLink action="SONG_OF_TORMENT"/> should be buffed by first using <DataLink action="BRISTLE"/>.
				This is a minor potency gain.
			</Trans>,
			tiers: SEVERITIES.UNBUFFED_SOT,
			why: <Trans id ="blu.song_of_torment.suggestion.unbuffed.why">
				<Plural value={this.unbuffedSongsOfTorment} one="# Song of Torment was" other="# Songs of Torment were"/> not buffed.
			</Trans>,
			value: this.unbuffedSongsOfTorment,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.unbuffedMortal ? this.data.actions.MORTAL_FLAME.icon : this.data.actions.BREATH_OF_MAGIC.icon,
			content: <Trans id = "blu.big-dot.suggestion.unbuffed.content">
				<DataLink action="BREATH_OF_MAGIC"/> and <DataLink action="MORTAL_FLAME"/> must always be buffed with <DataLink action="BRISTLE"/> and <DataLink action="MOON_FLUTE"/> for a colossal damage gain.
			</Trans>,
			tiers: {1: SEVERITY.MAJOR},
			why: this.unbuffedBigDoTWhy(this.unbuffedBoM, this.unbuffedMortal),
			value: this.unbuffedBoM + this.unbuffedMortal,
		}))
	}

	protected override addChecklistRules() {
		const SoTUptimePercent = this.getUptimePercent(this.data.statuses.BLEEDING.id)
		const requirements: Requirement[] = [
			new Requirement({
				name: <Trans id="blu.dots.requirement.uptime-bleed.name"><DataLink status="BLEEDING" showIcon={false} /> uptime</Trans>,
				percent: SoTUptimePercent,
			}),
		]

		const bomUptimePercent = this.getUptimePercent(this.data.statuses.BREATH_OF_MAGIC.id)
		if (bomUptimePercent > 1) {
			requirements.push(new Requirement({
				name: <Trans id="blu.dots.requirement.uptime-bom.name"><DataLink status="BREATH_OF_MAGIC" showIcon={false} /> uptime</Trans>,
				percent: bomUptimePercent,
			}))
		}

		const flameUptimePercent = this.getUptimePercent(this.data.statuses.MORTAL_FLAME.id)
		if (flameUptimePercent > 1) {
			requirements.push(new Requirement({
				name: <Trans id="blu.dots.requirement.uptime-flame.name"><DataLink status="MORTAL_FLAME" showIcon={false} /> uptime</Trans>,
				percent: flameUptimePercent,
			}))
		}

		this.checklist.add(new Rule({
			name: <Trans id="blu.dots.rule.name">Keep your DoTs up</Trans>,
			description: <Trans id="blu.dots.rule.description">
				The <DataLink status="BLEEDING" showIcon={false} showTooltip={false} /> effect from <DataLink action="NIGHTBLOOM" showIcon={false} showTooltip={false} /> and <DataLink action="SONG_OF_TORMENT" showIcon={false} showTooltip={false} /> is a solid 15% of your total damage. <br />
			If you are one of the DPSes applying <DataLink action="BREATH_OF_MAGIC" showIcon={false} showTooltip={false} /> or <DataLink action="MORTAL_FLAME" showIcon={false} showTooltip={false} />, it should be a top priority to keep these DoTs rolling.
			</Trans>,
			target: 95,
			requirements: requirements,
		}))
	}

	protected addClippingSuggestions() {
		const soTclippingPerMinute = this.getClippingAmount(this.data.statuses.BLEEDING.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SONG_OF_TORMENT.icon,
			content: <Trans id="blu.dots.suggestion.clip-bleed.content">
				Avoid refreshing <DataLink action="SONG_OF_TORMENT" showIcon={false} showTooltip={false} /> significantly before its expiration.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: soTclippingPerMinute,
			why: <Trans id="blu.dots.suggestion.clip-bleed.why">
				An average of {this.parser.formatDuration(soTclippingPerMinute)} of <DataLink status="BLEEDING" showIcon={false} /> clipped per minute due to early refreshes.
			</Trans>,
		}))

		const boMclippingPerMinute = this.getClippingAmount(this.data.statuses.BREATH_OF_MAGIC.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.BREATH_OF_MAGIC.icon,
			content: <Trans id="blu.dots.suggestion.clip-bleed.content">
				Avoid refreshing <DataLink action="BREATH_OF_MAGIC" showIcon={false} showTooltip={false} /> significantly before its expiration.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: boMclippingPerMinute,
			why: <Trans id="blu.dots.suggestion.clip-bleed.why">
				An average of {this.parser.formatDuration(boMclippingPerMinute)} of <DataLink status="BREATH_OF_MAGIC" showIcon={false} /> clipped per minute due to early refreshes.
			</Trans>,
		}))
	}
}

