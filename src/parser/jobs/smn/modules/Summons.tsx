import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, noneOf, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import Suggestions, {Suggestion, SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Accordion, Message, Table} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const DEMI_DURATION = 15000
const EXPECTED_DEMI_GCDS = 6

const MAX_POSSIBLE_RUBY_GCDS = 2
const MAX_POSSIBLE_CRIMSON_CYCLONE = 1
const MAX_POSSIBLE_CRIMSON_STRIKE = 1

const MAX_POSSIBLE_TOPAZ_GCDS = 4

const MAX_POSSIBLE_EMERALD_GCDS = 4
const MAX_POSSIBLE_SLIPSTREAM = 1

const SUMMON_SKILLS: ActionKey[] = [
	'SUMMON_BAHAMUT',
	'SUMMON_PHOENIX',
]

interface SummonWindow {
	demiSummon?: Events['action']
	demiGcds: number
	deathflareOrRekindle: number
	enkindle: number

	ifritSummon?: Events['action']
	rubyGcds: number
	crimsonCyclone: number
	crimsonStrike: number

	titanSummon?: Events['action']
	topazGcds: number
	mountainBusters: number

	garudaSummon?: Events['action']
	emeraldGcds: number
	slipstream: number

	fillerGcds: number
	ruinIV?: Events['action']
}

export class Summons extends Analyser {
	static override handle = 'summons'
	static override title = t('smn.summons.title')`Summons`
	static override displayOrder = DISPLAY_ORDER.SUMMONS

	@dependency private data!: Data
	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions
	@dependency private globalCooldown!: GlobalCooldown

	private history = new History<SummonWindow>(
		() => ({
			demiSummon: undefined,
			demiGcds: 0,
			deathflareOrRekindle: 0,
			enkindle: 0,

			ifritSummon: undefined,
			rubyGcds: 0,
			crimsonCyclone: 0,
			crimsonStrike: 0,

			titanSummon: undefined,
			topazGcds: 0,
			mountainBusters: 0,

			garudaSummon: undefined,
			emeraldGcds: 0,
			slipstream: 0,

			fillerGcds: 0,
			ruinIV: undefined,
		})
	)

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const summonIds = SUMMON_SKILLS.map(key => this.data.actions[key].id)

		this.addEventHook(
			playerFilter
				.action(oneOf(summonIds))
				.type('action'),
			this.onSummon
		)
		this.addEventHook(
			playerFilter
				.action(noneOf(summonIds))
				.type('action'),
			this.onNonSummon
		)
		this.addEventHook('complete', this.onComplete)
	}

	private onSummon(event: Events['action']) {
		const newWindow = this.history.openNew(event.timestamp)
		newWindow.data.demiSummon = event
	}

	private onNonSummon(event: Events['action']) {
		const current = this.history.getCurrent()
		if (current == null) { return }

		switch (event.action) {
		case this.data.actions.ASTRAL_IMPULSE.id:
		case this.data.actions.ASTRAL_FLARE.id:
		case this.data.actions.FOUNTAIN_OF_FIRE.id:
		case this.data.actions.BRAND_OF_PURGATORY.id:
			current.data.demiGcds += 1
			break
		case this.data.actions.DEATHFLARE.id:
		case this.data.actions.REKINDLE.id:
			current.data.deathflareOrRekindle += 1
			break
		case this.data.actions.ENKINDLE_BAHAMUT.id:
		case this.data.actions.ENKINDLE_PHOENIX.id:
			current.data.enkindle += 1
			break

		case this.data.actions.SUMMON_IFRIT.id:
		case this.data.actions.SUMMON_IFRIT_II.id:
			current.data.ifritSummon = event
			break
		case this.data.actions.RUBY_RUIN_III.id:
		case this.data.actions.RUBY_OUTBURST.id:
		case this.data.actions.RUBY_RITE.id:
		case this.data.actions.RUBY_CATASTROPHE.id:
			current.data.rubyGcds += 1
			break
		case this.data.actions.CRIMSON_CYCLONE.id:
			current.data.crimsonCyclone += 1
			break
		case this.data.actions.CRIMSON_STRIKE.id:
			current.data.crimsonStrike += 1
			break

		case this.data.actions.SUMMON_TITAN.id:
		case this.data.actions.SUMMON_TITAN_II.id:
			current.data.titanSummon = event
			break
		case this.data.actions.TOPAZ_RUIN_III.id:
		case this.data.actions.TOPAZ_OUTBURST.id:
		case this.data.actions.TOPAZ_RITE.id:
		case this.data.actions.TOPAZ_CATASTROPHE.id:
			current.data.topazGcds += 1
			break
		case this.data.actions.SMN_MOUNTAIN_BUSTER.id:
			current.data.mountainBusters += 1
			break

		case this.data.actions.SUMMON_GARUDA.id:
		case this.data.actions.SUMMON_GARUDA_II.id:
			current.data.garudaSummon = event
			break
		case this.data.actions.EMERALD_RUIN_III.id:
		case this.data.actions.EMERALD_OUTBURST.id:
		case this.data.actions.EMERALD_RITE.id:
		case this.data.actions.EMERALD_CATASTROPHE.id:
			current.data.emeraldGcds += 1
			break
		case this.data.actions.SLIPSTREAM.id:
			current.data.slipstream += 1
			break

		case this.data.actions.RUIN_III.id:
		case this.data.actions.TRI_DISASTER.id:
			current.data.fillerGcds += 1
			break
		case this.data.actions.RUIN_IV.id:
			current.data.ruinIV = event
			break
		default:
			break
		}
	}

	private onComplete() {
		this.history.closeCurrent(this.parser.pull.timestamp + this.parser.pull.duration)

		// Bahamut/Phoenix gcds
		// Ignore windows that end before the full duration of the demi
		let missed = this.history.entries
			.filter(entry => entry.start + DEMI_DURATION < (entry.end ?? 0))
			.reduce((acc, cur) => acc + Math.max(0, this.expectedDemiGcdsForWindow(cur) - cur.data.demiGcds), 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ASTRAL_IMPULSE.icon,
			content: <Trans id="smn.summons.demigcds.content">Be sure to get {EXPECTED_DEMI_GCDS} uses of the demi GCDs each time you summon them.
				(<ActionLink action="ASTRAL_IMPULSE"/> or <ActionLink action="ASTRAL_FLARE" /> for Bahamut and <ActionLink action="FOUNTAIN_OF_FIRE"/>
				or <ActionLink action="BRAND_OF_PURGATORY"/> for Phoenix)</Trans>,
			why: <Trans id="smn.summons.demigcds.why">You missed <Plural value={missed} one="# demi GCD" other="# demi GCDs"/>.</Trans>,
			value: missed,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
		}))

		// Deathflares (Rekindles are separate to allow for lower severity since they aren't a direct damage loss)
		missed = this.history.entries
			.filter(entry => entry.data.demiSummon?.action === this.data.actions.SUMMON_BAHAMUT.id && entry.data.deathflareOrRekindle === 0)
			.length
		if (missed > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.DEATHFLARE.icon,
				content: <Trans id="smn.summons.deathflare.content">Be sure to use <ActionLink action="DEATHFLARE"/> each time you summon Bahamut.</Trans>,
				why: <Trans id="smn.summons.deathflare.why">You failed to cast Deathflare <Plural value={missed} one="# time" other="# times"/>.</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		// Rekindles
		missed = this.history.entries
			.filter(entry => entry.data.demiSummon?.action === this.data.actions.SUMMON_PHOENIX.id && entry.data.deathflareOrRekindle === 0)
			.length
		if (missed > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.REKINDLE.icon,
				content: <Trans id="smn.summons.rekindle.content">Try to use <ActionLink action="REKINDLE"/> each time you summon Phoenix.
				While it is not a direct personal damage boost, it may improve healer damage by reducing their required healing.</Trans>,
				why: <Trans id="smn.summons.rekindle.why">You failed to cast Rekindle <Plural value={missed} one="# time" other="# times"/>.</Trans>,
				severity: SEVERITY.MINOR,
			}))
		}

		// Enkindles
		missed = this.history.entries.filter(entry => entry.data.enkindle === 0).length
		if (missed > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.ENKINDLE_BAHAMUT.icon,
				content: <Trans id="smn.summons.enkindle.content">Be sure to use <ActionLink action="ENKINDLE_BAHAMUT"/> each time you summon
				Bahamut and <ActionLink action="ENKINDLE_PHOENIX"/> each time you summon Phoenix.</Trans>,
				why: <Trans id="smn.summons.enkindle.why">You failed to cast an Enkindle ability <Plural value={missed} one="# time" other="# times"/>.</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		// Moutain Busters
		missed = this.history.entries.reduce((acc, cur) => acc + Math.max(0, cur.data.topazGcds - cur.data.mountainBusters), 0)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SMN_MOUNTAIN_BUSTER.icon,
			content: <Trans id="smn.summons.mountainbuster.content">Be sure to use <ActionLink action="SMN_MOUNTAIN_BUSTER"/> each time you cast
				<ActionLink action="TOPAZ_RITE"/> or <ActionLink action="TOPAZ_CATASTROPHE"/>.</Trans>,
			why: <Trans id="smn.summons.mountainbuster.why">You missed <Plural value={missed} one="# Mountain Buster" other="# Mountain Busters"/>.</Trans>,
			value: missed,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
		}))

		// Ruin IV during demi
		missed = this.history.entries
			.filter(entry => entry.data.ruinIV != null && entry.data.ruinIV.timestamp < entry.start + DEMI_DURATION)
			.length
		if (missed > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.RUIN_IV.icon,
				content: <Trans id="smn.summons.ruiniv-demi.content">Avoid using <ActionLink action="RUIN_IV"/> during a demi summon.</Trans>,
				why: <Trans id="smn.summons.ruiniv-demi.why">You used Ruin IV during a demi summon <Plural value={missed} one="# time" other="# times"/>.</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}
	}

	override output() {
		const rows = this.history.entries.map((entry) => this.buildPanel(entry)).filter(isDefined)
		return <>
			<Message>
				<Trans id="smn.summons.disclaimer">You should aim to use all three Arcanums between each summoning
				of Bahamut and Phoenix.  You should also aim to use all of the Attunement and Favor stacks of each
				summon.  However, this will not be possible when the boss goes invulnerable for extended periods of
				time.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={rows.map(row => row.panel)}
				styled
				fluid
				defaultActiveIndex={rows.map((row, idx) => row.hasError ? idx : -1).filter(i => i >= 0)}
			/>
		</>
	}

	private expectedDemiGcdsForWindow(window: HistoryEntry<SummonWindow>) {
		const demiEnd = window.start + DEMI_DURATION
		let downtimeDuringDemi = this.downtime.getDowntime(window.start, demiEnd)
		// treat end of fight as downtime for expected gcd count adjustment
		if (window.end != null && window.end < demiEnd) {
			downtimeDuringDemi += demiEnd - window.end
		}
		return EXPECTED_DEMI_GCDS - Math.ceil(downtimeDuringDemi / this.globalCooldown.getDuration())
	}

	private buildPanel(summon: HistoryEntry<SummonWindow>) {
		if (summon.data.demiSummon == null) { return undefined }

		const data = this.buildWindowOutput(summon)
		return {
			panel: {
				key: summon.start,
				title: {
					content: <>
						{this.parser.formatEpochTimestamp(summon.start)}: <ActionLink {...this.data.getAction(summon.data.demiSummon.action)} />
						{this.getEgiIcons(summon)}
					</>,
				},
				content: {content: data.display},
			},
			hasError: data.hasError,
		}
	}

	private getEgiIcons(summon: HistoryEntry<SummonWindow>) {
		const egis = [summon.data.titanSummon, summon.data.ifritSummon, summon.data.garudaSummon]
		egis.sort((a, b) => {
			if (a === undefined) { return -1 }
			if (b === undefined) { return 1 }
			return (a.timestamp > b.timestamp) ? -1 : 1
		})

		const retval: JSX.Element[] = []
		egis.forEach(egi => {
			if (egi !== undefined) {
				if (egi === summon.data.ifritSummon) {
					retval.push(<span style={{float: 'right'}}> <ActionLink showName={false} action="SUMMON_IFRIT_II" />&nbsp; </span>)
				} else if (egi === summon.data.garudaSummon) {
					retval.push(<span style={{float: 'right'}}> <ActionLink showName={false} action="SUMMON_GARUDA_II" />&nbsp; </span>)
				} else if (egi === summon.data.titanSummon) {
					retval.push(<span style={{float: 'right'}}> <ActionLink showName={false} action="SUMMON_TITAN_II" />&nbsp; </span>)
				}
			}
		})
		return retval
	}

	private buildWindowOutput(summon: HistoryEntry<SummonWindow>) {
		const demiRow = (summon.data.demiSummon?.action === this.data.actions.SUMMON_BAHAMUT.id) ?
			this.buildBahamutRow(summon) :
			this.buildPhoenixRow(summon)

		const missedMountainBusters = summon.data.mountainBusters < summon.data.topazGcds
		const badR4 = (summon.data.ruinIV == null && summon.data.fillerGcds > 0) ||
			(summon.data.ruinIV != null && summon.data.ruinIV.timestamp < summon.start + DEMI_DURATION)

		return {
			hasError: demiRow.hasError || missedMountainBusters || badR4,
			display: <Table>
				{demiRow.display}
				<Table.Row>
					<Table.Cell positive={summon.data.ifritSummon != null}>
						<ActionLink showName={false} action="SUMMON_IFRIT_II" />
						&nbsp;{this.printUsageTime(summon.data.ifritSummon)}
					</Table.Cell>
					<Table.Cell positive={summon.data.rubyGcds === MAX_POSSIBLE_RUBY_GCDS}>
						<ActionLink showName={false} action="RUBY_RITE" />/<ActionLink showName={false} action="RUBY_CATASTROPHE" />
						&nbsp;{summon.data.rubyGcds}
					</Table.Cell>
					<Table.Cell positive={summon.data.crimsonCyclone === MAX_POSSIBLE_CRIMSON_CYCLONE}>
						<ActionLink showName={false} action="CRIMSON_CYCLONE" />
						&nbsp;{summon.data.crimsonCyclone}
					</Table.Cell>
					<Table.Cell positive={summon.data.crimsonStrike === MAX_POSSIBLE_CRIMSON_STRIKE}>
						<ActionLink showName={false} action="CRIMSON_STRIKE" />
						&nbsp;{summon.data.crimsonStrike}
					</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell positive={summon.data.titanSummon != null}>
						<ActionLink showName={false} action="SUMMON_TITAN_II" />
						&nbsp;{this.printUsageTime(summon.data.titanSummon)}
					</Table.Cell>
					<Table.Cell positive={summon.data.topazGcds === MAX_POSSIBLE_TOPAZ_GCDS}>
						<ActionLink showName={false} action="TOPAZ_RITE" />/<ActionLink showName={false} action="TOPAZ_CATASTROPHE" />
						&nbsp;{summon.data.topazGcds}
					</Table.Cell>
					<Table.Cell
						positive={summon.data.mountainBusters === summon.data.topazGcds}
						negative={missedMountainBusters}>
						<ActionLink showName={false} action="SMN_MOUNTAIN_BUSTER" />
						&nbsp;{summon.data.mountainBusters}
					</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell positive={summon.data.garudaSummon != null}>
						<ActionLink showName={false} action="SUMMON_GARUDA_II" />
						&nbsp;{this.printUsageTime(summon.data.garudaSummon)}
					</Table.Cell>
					<Table.Cell positive={summon.data.emeraldGcds === MAX_POSSIBLE_EMERALD_GCDS}>
						<ActionLink showName={false} action="EMERALD_RITE" />/<ActionLink showName={false} action="EMERALD_CATASTROPHE" />
						&nbsp;{summon.data.emeraldGcds}
					</Table.Cell>
					<Table.Cell positive={summon.data.slipstream === MAX_POSSIBLE_SLIPSTREAM}>
						<ActionLink showName={false} action="SLIPSTREAM" />
						&nbsp;{summon.data.slipstream}
					</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell>
						Uptime: {this.parser.formatDuration(Math.max(0, (summon.end ?? summon.start) - summon.start - this.downtime.getDowntime(summon.start, summon.end)))}
					</Table.Cell>
					<Table.Cell>
						<ActionLink showName={false} action="RUIN_III" />/<ActionLink showName={false} action="TRI_DISASTER" />
						&nbsp;{summon.data.fillerGcds}
					</Table.Cell>
					<Table.Cell
						positive={summon.data.ruinIV != null && summon.data.ruinIV.timestamp >= summon.start + DEMI_DURATION}
						negative={badR4}>
						<ActionLink showName={false} action="RUIN_IV" />
						&nbsp;{(summon.data.ruinIV == null) ? 0 : 1}
					</Table.Cell>
				</Table.Row>
			</Table>,
		}
	}

	private buildBahamutRow(summon: HistoryEntry<SummonWindow>) {
		const expectedGcds = this.expectedDemiGcdsForWindow(summon)

		const missingGcds = summon.data.demiGcds < expectedGcds
		const missingAstralFlow = summon.data.deathflareOrRekindle < 1
		const missingEnkindle = summon.data.enkindle < 1

		return {
			hasError: missingGcds || missingAstralFlow || missingEnkindle,
			display: <Table.Row>
				<Table.Cell>
					<ActionLink showName={false} action="SUMMON_BAHAMUT" />
					&nbsp;{this.parser.formatEpochTimestamp(summon.start)}
				</Table.Cell>
				<Table.Cell positive={!missingGcds} negative={missingGcds}>
					<ActionLink showName={false} action="ASTRAL_IMPULSE" />/<ActionLink showName={false} action="ASTRAL_FLARE" />
					&nbsp;{summon.data.demiGcds}
				</Table.Cell>
				<Table.Cell positive={!missingAstralFlow} negative={missingAstralFlow}>
					<ActionLink showName={false} action="DEATHFLARE" />
					&nbsp;{summon.data.deathflareOrRekindle}
				</Table.Cell>
				<Table.Cell positive={!missingEnkindle} negative={missingEnkindle}>
					<ActionLink showName={false} action="ENKINDLE_BAHAMUT" />
					&nbsp;{summon.data.enkindle}
				</Table.Cell>
			</Table.Row>,
		}
	}

	private buildPhoenixRow(summon: HistoryEntry<SummonWindow>) {
		const expectedGcds = this.expectedDemiGcdsForWindow(summon)

		const missingGcds = summon.data.demiGcds < expectedGcds
		const missingAstralFlow = summon.data.deathflareOrRekindle < 1
		const missingEnkindle = summon.data.enkindle < 1

		return {
			hasError: missingGcds || missingAstralFlow || missingEnkindle,
			display: <Table.Row>
				<Table.Cell>
					<ActionLink showName={false} action="SUMMON_PHOENIX" />
					&nbsp;{this.parser.formatEpochTimestamp(summon.start)}
				</Table.Cell>
				<Table.Cell positive={!missingGcds} negative={missingGcds}>
					<ActionLink showName={false} action="FOUNTAIN_OF_FIRE" />/<ActionLink showName={false} action="BRAND_OF_PURGATORY" />
					&nbsp;{summon.data.demiGcds}
				</Table.Cell>
				<Table.Cell positive={!missingAstralFlow} negative={missingAstralFlow}>
					<ActionLink showName={false} action="REKINDLE" />
					&nbsp;{summon.data.deathflareOrRekindle}
				</Table.Cell>
				<Table.Cell positive={!missingEnkindle} negative={missingEnkindle}>
					<ActionLink showName={false} action="ENKINDLE_PHOENIX" />
					&nbsp;{summon.data.enkindle}
				</Table.Cell>
			</Table.Row>,
		}
	}

	private printUsageTime(summon?: Events['action']) {
		if (summon == null) { return 'N/A' }
		return this.parser.formatEpochTimestamp(summon.timestamp)
	}

}
