import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import {DataLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {EnumGauge} from 'parser/core/modules/Gauge/EnumGauge'
import {SetGauge} from 'parser/core/modules/Gauge/SetGauge'
import {DEFAULT_ROW_HEIGHT, GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isSuccessfulHit} from 'utilities'

const SUBTRACTIVE_COST = 50

type GaugeModifier = Partial<Record<Event['type'], number>>
interface CanvasModification {
	type: 'generate' | 'spend'
	which: 'creature' | 'weapon' | 'landscape'
}
type CanvasModifier = Partial<Record<Event['type'], CanvasModification>>

const WHITE_PAINT = 'whitepaint'
const BLACK_PAINT = 'blackpaint'

const CREATURE_MOTIF = 'creature'
const POM_MOTIF = 'pommotif'
const WING_MOTIF = 'wingmotif'
const CLAW_MOTIF = 'clawmotif'
// Will need this later...
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAW_MOTIF = 'mawmotif'
const WEAPON_MOTIF = 'weapon'
const LANDSCAPE_MOTIF = 'landscape'

const MOOGLE_PORTRAIT = 'moogle'
const MADEEN_PORTRAIT = 'madeen'

/** Graph colors/fade settings */
const PALETTE_GAUGE_COLOR = Color(JOBS.PICTOMANCER.colour).fade(GAUGE_FADE)
const WHITE_PAINT_COLOR = Color('#00ffff').fade(GAUGE_FADE)
const BLACK_PAINT_COLOR = Color('#d954d9').fade(GAUGE_FADE)
const POM_COLOR = Color('#d8ac98').fade(GAUGE_FADE)
const WING_COLOR = Color('#ca8be3').fade(GAUGE_FADE)
const CLAW_COLOR = Color('#caba79').fade(GAUGE_FADE)
const MAW_COLOR = Color('#96c87a').fade(GAUGE_FADE)
const WEAPON_MOTIF_COLOR = Color('#d76b79').fade(GAUGE_FADE)
const LANDSCAPE_MOTIF_COLOR = Color('#909fe0').fade(GAUGE_FADE)
const MOOGLE_COLOR = Color('#b256d6').fade(GAUGE_FADE)
const MADEEN_COLOR = Color('#7fbb6c').fade(GAUGE_FADE)

const GAUGE_DISPLAY_ORDER = {
	PALETTE: 5,
	PAINT: 4,
	MOTIF: 3,
	DEPICTION: 2,
	PORTRAIT: 1,
}

export class Gauge extends CoreGauge {
	static override handle = 'gauge'
	static override title = t('pct.gauge.title')`Gauge`

	@dependency private actors!: Actors
	@dependency private suggestions!: Suggestions

	private paletteGauge = this.add(new CounterGauge({
		graph: {
			handle: 'palette',
			label: <Trans id="pct.gauge.resource.palette">Palette Gauge</Trans>,
			color: PALETTE_GAUGE_COLOR,
			forceCollapsed: true,
			order: GAUGE_DISPLAY_ORDER.PALETTE,
		},
		correctHistory: true,
	}))

	private paletteGaugeModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.WATER_IN_BLUE.id, {damage: 25}],
		[this.data.actions.WATER_II_IN_BLUE.id, {damage: 25}],

		// Spenders
		[this.data.actions.SUBTRACTIVE_PALETTE.id, {action: -SUBTRACTIVE_COST}],
	])

	private paintGauge = this.add(new EnumGauge({
		maximum: 5,
		options: [
			{
				value: BLACK_PAINT,
				label: <Trans id="pct.paintgauge.black-paint.label">Black Paint</Trans>,
				color: BLACK_PAINT_COLOR,
				tooltipHideWhenEmpty: true,
			},
			{
				value: WHITE_PAINT,
				label: <Trans id="pct.paintgauge.white-paint.label">White Paint</Trans>,
				color: WHITE_PAINT_COLOR,
			},
		],
		graph: {
			handle: 'paint',
			label: <Trans id="pct.gauge.resource.paint">Paint</Trans>,
			tooltipHideMaximum: true,
			order: GAUGE_DISPLAY_ORDER.PAINT,
		},
	}))

	private whitePaintGenerators = [
		this.data.actions.WATER_IN_BLUE.id,
		this.data.actions.WATER_II_IN_BLUE.id,
		this.data.actions.THUNDER_IN_MAGENTA.id,
		this.data.actions.THUNDER_II_IN_MAGENTA.id,
		this.data.actions.RAINBOW_DRIP.id,
	]

	private canvasGauge = this.add(new SetGauge({
		options: [
			{
				value: LANDSCAPE_MOTIF,
				label: <Trans id="pct.canvasgauge.landscape-motif.label">Landscape Motif</Trans>,
				color: LANDSCAPE_MOTIF_COLOR,
			},
			{
				value: WEAPON_MOTIF,
				label: <Trans id="pct.canvasgauge.weapon-motif.label">Weapon Motif</Trans>,
				color: WEAPON_MOTIF_COLOR,
			},
			{
				value: CREATURE_MOTIF,
				label: <Trans id="pct.canvasgauge.creature-motif.label">Creature Motif</Trans>,
				color: MAW_COLOR, // Use Maw Motif for the color for now, until I can figure out SetEnum gauge :(
			},
		],
		graph: {
			handle: 'canvas',
			label: <Trans id="pct.gauge.resource.canvas">Canvas</Trans>,
			tooltipHideWhenEmpty: true,
			order: GAUGE_DISPLAY_ORDER.MOTIF,
		},
	}))

	private canvasModifiers = new Map<number, CanvasModifier>([
		// Builders
		[this.data.actions.POM_MOTIF.id, {action: {type: 'generate', which: 'creature'}}],
		[this.data.actions.WING_MOTIF.id, {action: {type: 'generate', which: 'creature'}}],
		[this.data.actions.CLAW_MOTIF.id, {action: {type: 'generate', which: 'creature'}}],
		[this.data.actions.MAW_MOTIF.id, {action: {type: 'generate', which: 'creature'}}],
		[this.data.actions.HAMMER_MOTIF.id, {action: {type: 'generate', which: 'weapon'}}],
		[this.data.actions.STARRY_SKY_MOTIF.id, {action: {type: 'generate', which: 'landscape'}}],

		// Spenders
		[this.data.actions.POM_MUSE.id, {action: {type: 'spend', which: 'creature'}}],
		[this.data.actions.WINGED_MUSE.id, {action: {type: 'spend', which: 'creature'}}],
		[this.data.actions.CLAWED_MUSE.id, {action: {type: 'spend', which: 'creature'}}],
		[this.data.actions.FANGED_MUSE.id, {action: {type: 'spend', which: 'creature'}}],
		[this.data.actions.STRIKING_MUSE.id, {action: {type: 'spend', which: 'weapon'}}],
		[this.data.actions.STARRY_MUSE.id, {action: {type: 'spend', which: 'landscape'}}],
	])

	private depictionGauge = this.add(new SetGauge({
		options: [
			{
				value: POM_MOTIF,
				label: <Trans id="pct.depictiongauge.pom.label">Pom Depiction</Trans>,
				color: POM_COLOR,
			},
			{
				value: WING_MOTIF,
				label: <Trans id="pct.depictiongauge.wing.label">Wing Depiction</Trans>,
				color: WING_COLOR,
			},
			{
				value: CLAW_MOTIF,
				label: <Trans id="pct.depictiongauge.clawotif.label">Claw Depiction</Trans>,
				color: CLAW_COLOR,
			},
		],
		graph: {
			handle: 'depictions',
			label: <Trans id="pct.gauge.resource.depictions">Depictions</Trans>,
			tooltipHideWhenEmpty: true,
			order: GAUGE_DISPLAY_ORDER.DEPICTION,
		},
	}))

	private depictionModifiers = [
		this.data.actions.POM_MUSE.id,
		this.data.actions.WINGED_MUSE.id,
		this.data.actions.CLAWED_MUSE.id,
		this.data.actions.FANGED_MUSE.id,
	]

	private portraitGauge = this.add(new EnumGauge({
		maximum: 1,
		options: [
			{
				value: MOOGLE_PORTRAIT,
				label: <Trans id="pct.portraitgauge.moogle-portrait.label">Moogle Portrait</Trans>,
				color: MOOGLE_COLOR,
				tooltipHideWhenEmpty: true,
			},
			{
				value: MADEEN_PORTRAIT,
				label: <Trans id="pct.portraitgauge.madeen-portrait.label">Madeen Portrait</Trans>,
				color: MADEEN_COLOR,
				tooltipHideWhenEmpty: true,
			},
		],
		graph: {
			handle: 'portraits',
			label: <Trans id="pct.gauge.resource.portraits">Portraits</Trans>,
			order: GAUGE_DISPLAY_ORDER.PORTRAIT,
			tooltipHideMaximum: true,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			height: DEFAULT_ROW_HEIGHT / 3,
		},
	}))

	private portraitGenerators = [
		this.data.actions.WINGED_MUSE.id,
		this.data.actions.FANGED_MUSE.id,
	]

	private portraitSpenders = [
		this.data.actions.MOG_OF_THE_AGES.id,
		this.data.actions.RETRIBUTION_OF_THE_MADEEN.id,
	]

	private nextWhiteIsBlack = false
	private overtones = 0
	private overwrotePortrait = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		const paletteActions = Array.from(this.paletteGaugeModifiers.keys())
		this.addEventHook(playerFilter.type('action').action(oneOf(paletteActions)), this.onPaletteModifer)
		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseActionId(paletteActions)), this.onPaletteModifer)

		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseActionId(this.whitePaintGenerators)), this.onWhitePaintGenerator)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.HOLY_IN_WHITE.id), this.onWhitePaintSpender)

		this.addEventHook(playerFilter.type('action').action(this.data.actions.COMET_IN_BLACK.id), this.onBlackPaintSpender)

		this.addEventHook(playerFilter.type('action').action(this.data.actions.SUBTRACTIVE_PALETTE.id), this.onSubtractivePalette)

		const canvasActions = Array.from(this.canvasModifiers.keys())
		this.addEventHook(playerFilter.type('action').action(oneOf(canvasActions)), this.onCanvasModifier)

		this.addEventHook(playerFilter.type('action').action(oneOf(this.depictionModifiers)), this.onDepictionModifier)

		this.addEventHook(playerFilter.type('action').action(oneOf(this.portraitGenerators)), this.onPortraitGenerator)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.portraitSpenders)), () => this.portraitGauge.reset())

		// Default assume the player painted before the pull, until backtrack corrections are supported
		this.canvasGauge.set([
			{handle: CREATURE_MOTIF, value: POM_MOTIF},
			{handle: WEAPON_MOTIF, value: HAMMER_MOTIF},
			{handle: LANDSCAPE_MOTIF, value: STARRY_MOTIF},
		])

		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		// Suggestion to not overcap the palette gauge
		const lostSubtractives = Math.floor(this.paletteGauge.overCap / SUBTRACTIVE_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SUBTRACTIVE_PALETTE.icon,
			value: lostSubtractives,
			content: <Trans id="pct.gauge.suggestions.lost-subtractives.content">Overcapping the Palette gauge will cause you to lose uses of <DataLink action="SUBTRACTIVE_PALETTE"/> over the course of the fight, leading to lost potency. Make sure to use your gauge before it overcaps.</Trans>,
			why: <Trans id="pct.gauge.suggestions.lost-subtractives.why">You lost <Plural value={lostSubtractives} one="# use" other="# uses" /> of <DataLink showIcon={false} action="SUBTRACTIVE_PALETTE" /> due to overcapping the Palette gauge.</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))

		// Suggestion to not overwrite Monochrome Tones
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.COMET_IN_BLACK.icon,
			value: this.overtones,
			content: <Trans id="pct.gauge.suggestions.overwrote-monochrome.content">Using <DataLink action="SUBTRACTIVE_PALETTE" /> a second time before casting <DataLink action="COMET_IN_BLACK" /> will lose you a use due to overwriting your <DataLink status="MONOCHROME_TONES" /> buff.</Trans>,
			why: <Trans id="pct.gauge.suggestions.overwrote-monochrome.why">You overwrote <DataLink showIcon={false} status="MONOCHROME_TONES" /> <Plural value={this.overtones} one="# time" other="# times" />.</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))

		// Suggestion to not overwrite Mog/Madeen
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.RETRIBUTION_OF_THE_MADEEN.icon,
			value: this.overwrotePortrait,
			content: <Trans id="pct.gauge.suggestions.overwrote-portrait.content">
				Rendering <DataLink action="WINGED_MUSE" /> or <DataLink action="FANGED_MUSE" /> without using <DataLink action="MOG_OF_THE_AGES" /> or <DataLink action="RETRIBUTION_OF_THE_MADEEN" /> will overwrite your Portrait.
				Make sure you use every Portrait you paint.
			</Trans>,
			why: <Trans id="pct.gauge.suggestions.overwrote-portrait.why">You overwrote your Portrait <Plural value={this.overwrotePortrait} one="# time" other="# times" />.</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
		}))
	}

	// Canvas, Depictions, and Portrait don't reset on death, override onDeath handling to only reset Paint and Palette
	override onDeath() {
		this.paintGauge.reset()
		this.paletteGauge.reset()
	}

	private onPaletteModifer(event: Event) {
		let eventActionId
		if (event.type === 'damage' && event.cause.type === 'action' && isSuccessfulHit(event)) {
			eventActionId = event.cause.action
		} else if (event.type === 'action') {
			eventActionId = event.action
		}
		if (eventActionId == null) { return }

		// Subtractive Palette does not spend gauge if Subtractive Spectrum is currently active
		if (eventActionId === this.data.actions.SUBTRACTIVE_PALETTE.id &&
			this.actors.current.hasStatus(this.data.statuses.SUBTRACTIVE_SPECTRUM.id)) {
			return
		}

		const modifier = this.paletteGaugeModifiers.get(eventActionId)
		if (modifier == null) { return }

		this.paletteGauge.modify(modifier[event.type] ?? 0)
	}

	private onWhitePaintGenerator(event: Events['damage']) {
		if (!isSuccessfulHit(event)) { return }

		// If we need to generate a Black Paint because there were no White Paints available when the player hit Subtractive Palette,
		// do that instead
		if (this.nextWhiteIsBlack) {
			this.paintGauge.generate(BLACK_PAINT)
			this.nextWhiteIsBlack = false
			return
		}

		// Otherwise generate the White Paint as expected
		this.paintGauge.generate(WHITE_PAINT)
	}

	private onWhitePaintSpender() {
		this.paintGauge.spend(WHITE_PAINT)
	}

	private onBlackPaintSpender() {
		this.paintGauge.spend(BLACK_PAINT)
	}

	private onSubtractivePalette(event: Events['action']) {
		if (this.actors.current.hasStatus(this.data.statuses.MONOCHROME_TONES.id)) {
			this.overtones++
		}

		// If we have a White Paint available, Subtractive Palette swaps it for a Black Paint
		if (this.paintGauge.getCountAt(WHITE_PAINT, event.timestamp) > 0) {
			this.paintGauge.spend(WHITE_PAINT)
			this.paintGauge.generate(BLACK_PAINT)
			return
		}

		// Otherwise, the next White Paint that would generate will be a Black Paint instead
		this.nextWhiteIsBlack = true
	}

	private onCanvasModifier(event: Events['action']) {
		const modifier = this.canvasModifiers.get(event.action)
		if (modifier == null) { return }

		const canvasMod = modifier[event.type]
		if (canvasMod == null) { return }

		if (canvasMod.type === 'generate') {
			this.canvasGauge.generate(canvasMod.which)
		} else if (canvasMod.type === 'spend') {
			this.canvasGauge.spend(canvasMod.which)
		}
	}

	private onDepictionModifier(event: Events['action']) {
		switch (event.action) {
		// Fanged Muse resets the depiction state while generating Madeen
		case this.data.actions.FANGED_MUSE.id:
			this.depictionGauge.reset()
			break
		// The other muses add their creature to the depiction set
		case this.data.actions.CLAWED_MUSE.id:
			this.depictionGauge.generate(CLAW_MOTIF)
		// Switch case fallthrough as a pseudo history correction for dungeon/24man depiction state carryover since this isn't a counter gauge with correction built in
		/* eslint-disable no-fallthrough */
		case this.data.actions.WINGED_MUSE.id:
			if (!this.depictionGauge.getStateAt(WING_MOTIF)) {
				this.depictionGauge.generate(WING_MOTIF)
			}
		case this.data.actions.POM_MUSE.id:
			if (!this.depictionGauge.getStateAt(POM_MOTIF)) {
				this.depictionGauge.generate(POM_MOTIF)
			}
			/* eslint-enable no-fallthrough */
		}
	}

	private onPortraitGenerator(event: Events['action']) {
		if (this.portraitGauge.capped) {
			this.overwrotePortrait++
		}

		switch (event.action) {
		case this.data.actions.WINGED_MUSE.id:
			this.portraitGauge.generate(MOOGLE_PORTRAIT)
			break
		case this.data.actions.FANGED_MUSE.id:
			this.portraitGauge.generate(MADEEN_PORTRAIT)
			break
		}
	}
}

