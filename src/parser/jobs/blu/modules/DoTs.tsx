import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
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
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

    private unbuffedSongsOfTorment = 0;

	protected override trackedStatuses = [
		this.data.statuses.BLEEDING.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('action').action(this.data.actions.SONG_OF_TORMENT.id), this.onApplyingSoT)

	}
	private onApplyingSoT() {
		if (this.actors.current.hasStatus(this.data.statuses.BRISTLE.id)) { // Boost effect from Bristle is present
			return
		}

		// Bristle was not used, which is a (relatively minor) ~65 potency loss
		this.unbuffedSongsOfTorment++
	}

	override onComplete() {
		super.onComplete()
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SONG_OF_TORMENT.icon,
			content: <Trans id = "blu.song_of_torment.suggestion.unbuffed.content">
				Ideally every <DataLink action="SONG_OF_TORMENT"/> should be buffed by first using <DataLink action="BRISTLE"/>.
                This is a minor potency gain.
			</Trans>,
			tiers: SEVERITIES.UNBUFFED_SOT,
			why: <Trans id ="blu.song_of_torment.suggestion.unbuffed.why">
				<Plural value={this.unbuffedSongsOfTorment ?? 0} one="# Song of Torment was" other="# Songs of Torment were"/> not buffed.
			</Trans>,
			value: this.unbuffedSongsOfTorment,
		}))
	}

	protected override addChecklistRules() {
		const uptimePercent = this.getUptimePercent(this.data.statuses.BLEEDING.id)
		this.checklist.add(new TieredRule({
			name: <Trans id="blu.dots.rule.name">Keep your DoTs up </Trans>,
			description: <Trans id="blu.dots.rule.description">
				The <DataLink status="BLEEDING" showIcon={false} showTooltip={false} /> effect from Nightbloom and SoT is a solid 15% of your total damage.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="blu.dots.requirement.uptime-bleed.name"><DataLink status="BLEEDING" /> uptime</Trans>,
					percent: uptimePercent,
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		const clippingPerMinute = this.getClippingAmount(this.data.statuses.BLEEDING.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SONG_OF_TORMENT.icon,
			content: <Trans id="blu.dots.suggestion.clip-bleed.content">
				Avoid refreshing Song of Torment significantly before its expiration, this will allow you to cast more Sonic Boom.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: clippingPerMinute,
			why: <Trans id="blu.dots.suggestion.clip-bleed.why">
				An average of {this.parser.formatDuration(clippingPerMinute)} of <DataLink status="BLEEDING" /> clipped per minute due to early refreshes.
			</Trans>,
		}))
	}
}

