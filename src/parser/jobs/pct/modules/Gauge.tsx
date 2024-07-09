import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {JOBS} from 'data/JOBS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import {EnumGauge} from 'parser/core/modules/Gauge/EnumGauge'
import {SetGauge} from 'parser/core/modules/Gauge/SetGauge'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import React from 'react'
import {isSuccessfulHit} from 'utilities'

type GaugeModifier = Partial<Record<Event['type'], number>>
interface MotifModification {
	type: 'generate' | 'spend'
	which: 'creature' | 'weapon' | 'landscape'
}
type MotifModifer = Partial<Record<Event['type'], MotifModification>>

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
const POM_MOTIF_COLOR = Color('#882a0f').fade(GAUGE_FADE)
const WING_MOTIF_COLOR = Color('#7641c0').fade(GAUGE_FADE)
const CLAW_MOTIF_COLOR = Color('#8f5c0f').fade(GAUGE_FADE)
const MAW_MOTIF_COLOR = Color('#5c943b').fade(GAUGE_FADE)
const WEAPON_MOTIF_COLOR = Color('#9f3837').fade(GAUGE_FADE)
const LANDSCAPE_MOTIF_COLOR = Color('#3e48c4').fade(GAUGE_FADE)
const MOOGLE_COLOR = Color('#a744c7').fade(GAUGE_FADE)
const MADEEN_COLOR = Color('#28620b').fade(GAUGE_FADE)

export class Gauge extends CoreGauge {
	static override handle = 'gauge'
	static override title = t('pct.gauge.title')`Gauge`

	@dependency private actors!: Actors

	private paletteGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="pct.gauge.resource.palette">Palette Gauge</Trans>,
			color: PALETTE_GAUGE_COLOR,
			forceCollapsed: true,
		},
		correctHistory: true,
	}))

	private paletteGaugeModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.WATER_IN_BLUE.id, {damage: 25}],
		[this.data.actions.WATER_II_IN_BLUE.id, {damage: 25}],

		// Spenders
		[this.data.actions.SUBTRACTIVE_PALLETTE.id, {action: -50}],
	])

	private paintGauge = this.add(new EnumGauge({
		maximum: 5,
		options: [
			{
				value: BLACK_PAINT,
				label: <Trans id="pct.paintgauge.black-paint.label">Black Paint</Trans>,
				color: BLACK_PAINT_COLOR,
			},
			{
				value: WHITE_PAINT,
				label: <Trans id="pct.paintgauge.white-paint.label">White Paint</Trans>,
				color: WHITE_PAINT_COLOR,
			},
		],
		graph: {
			handle: 'paintgauge',
			label: <Trans id="pct.gauge.resource.paint">Paint</Trans>,
			tooltipHideWhenEmpty: true,
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
				value: CREATURE_MOTIF,
				label: <Trans id="pct.canvasgauge.creature-motif.label">Creature Motif</Trans>,
				color: MAW_MOTIF_COLOR, // Use Maw Motif for the color for now, until I can figure out SetEnum gauge :(
			},
			{
				value: WEAPON_MOTIF,
				label: <Trans id="pct.canvasgauge.weapon-motif.label">Weapon Motif</Trans>,
				color: WEAPON_MOTIF_COLOR,
			},
			{
				value: LANDSCAPE_MOTIF,
				label: <Trans id="pct.canvasgauge.landscape-motif.label">Landscape Motif</Trans>,
				color: LANDSCAPE_MOTIF_COLOR,
			},
		],
		graph: {
			handle: 'motifgauge',
			label: <Trans id="pct.gauge.resource.motif">Motifs</Trans>,
			tooltipHideWhenEmpty: true,
		},
	}))

	private motifModifiers = new Map<number, MotifModifer>([
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
		[this.data.actions.STEEL_MUSE.id, {action: {type: 'spend', which: 'weapon'}}],
		[this.data.actions.STARRY_MUSE.id, {action: {type: 'spend', which: 'landscape'}}],
	])

	private creatureDepictions = this.add(new SetGauge({
		options: [
			{
				value: POM_MOTIF,
				label: <Trans id="pct.canvasgauge.pom-motif.label">Pom Motif</Trans>,
				color: POM_MOTIF_COLOR,
			},
			{
				value: WING_MOTIF,
				label: <Trans id="pct.canvasgauge.wing-motif.label">Wing Motif</Trans>,
				color: WING_MOTIF_COLOR,
			},
			{
				value: CLAW_MOTIF,
				label: <Trans id="pct.canvasgauge.claw-motif.label">Claw Motif</Trans>,
				color: CLAW_MOTIF_COLOR,
			},
		],
		graph: {
			handle: 'depictions',
			label: <Trans id="pct.gauge.resource.depictions">Depictions</Trans>,
			tooltipHideWhenEmpty: true,
		},
	}))

	private creatureDepictionModifiers = [
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
			},
			{
				value: MADEEN_PORTRAIT,
				label: <Trans id="pct.portraitgauge.madeen-portrait.label">Madeen Portrait</Trans>,
				color: MADEEN_COLOR,
			},
		],
		graph: {
			handle: 'portraits',
			label: <Trans id="pct.gauge.resource.portraits">Portraits</Trans>,
			tooltipHideWhenEmpty: true,
		},
	}))

	private portraitGaugeModifers = [
		this.data.actions.WINGED_MUSE.id,
		this.data.actions.MOG_OF_THE_AGES.id,
		this.data.actions.FANGED_MUSE.id,
		this.data.actions.RETRIBUTION_OF_THE_MADEEN.id,
	]

	private nextWhiteIsBlack = false

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		const paletteActions = Array.from(this.paletteGaugeModifiers.keys())
		this.addEventHook(playerFilter.action(oneOf(paletteActions)), this.onPaletteModifer)

		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseActionId(this.whitePaintGenerators)), this.onWhitePaintGenerator)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.HOLY_IN_WHITE.id), this.onWhitePaintSpender)

		this.addEventHook(playerFilter.type('action').action(this.data.actions.COMET_IN_BLACK.id), this.onBlackPaintSpender)

		this.addEventHook(playerFilter.type('action').action(this.data.actions.SUBTRACTIVE_PALLETTE.id), this.onSubtractivePalette)

		const motifActions = Array.from(this.motifModifiers.keys())
		this.addEventHook(playerFilter.type('action').action(oneOf(motifActions)), this.onMotifModifier)

		this.addEventHook(playerFilter.type('action').action(oneOf(this.creatureDepictionModifiers)), this.onDepictionModifier)

		this.addEventHook(playerFilter.type('action').action(oneOf(this.portraitGaugeModifers)), this.onPortraitModifier)

		this.addEventHook('complete', this.onComplete)
	}

	private onPaletteModifer(event: Event) {
		let eventActionId
		if (event.type === 'damage' && event.cause.type === 'action' && isSuccessfulHit(event)) {
			eventActionId = event.cause.action
		} else if (event.type === 'action') {
			eventActionId = event.action
		}
		if (eventActionId == null) { return }

		// Subtractive Pallet does not spend gauge if Subtractive Spectrum is currently active
		if (eventActionId === this.data.actions.SUBTRACTIVE_PALLETTE.id &&
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
		// If we have a White Paint available, Subtractive Palette swaps it for a Black Paint
		if (this.paintGauge.getCountAt(WHITE_PAINT, event.timestamp) > 0) {
			this.paintGauge.spend(WHITE_PAINT)
			this.paintGauge.generate(BLACK_PAINT)
			return
		}

		// Otherwise, the next White Paint that would generate will be a Black Paint instead
		this.nextWhiteIsBlack = true
	}

	private onMotifModifier(event: Events['action']) {
		const modifier = this.motifModifiers.get(event.action)
		if (modifier == null) { return }

		const motifMod = modifier[event.type]
		if (motifMod == null) { return }

		if (motifMod.type === 'generate') {
			this.canvasGauge.generate(motifMod.which)
		} else if (motifMod.type === 'spend') {
			this.canvasGauge.spend(motifMod.which)
		}
	}

	private onDepictionModifier(event: Events['action']) {
		switch (event.action) {
		// Fanged Muse resets the depiction state while generating Madeen
		case this.data.actions.FANGED_MUSE.id:
			this.creatureDepictions.reset()
			break
		// The other muses add their creature to the depiction set
		case this.data.actions.CLAWED_MUSE.id:
			this.creatureDepictions.generate(CLAW_MOTIF)
		// Switch case fallthrough as a pseudo history correction for dungeon/24man depiction state carryover since this isn't a counter gauge with correction built in
		/* eslint-disable no-fallthrough */
		case this.data.actions.WINGED_MUSE.id:
			if (!this.creatureDepictions.getStateAt(WING_MOTIF)) {
				this.creatureDepictions.getStateAt(WING_MOTIF)
			}
		case this.data.actions.POM_MUSE.id:
			if (!this.creatureDepictions.getStateAt(POM_MOTIF)) {
				this.creatureDepictions.getStateAt(POM_MOTIF)
			}
			/* eslint-enable no-fallthrough */
		}
	}

	private onPortraitModifier(event: Events['action']) {
		this.portraitGauge.reset() // Spend, or make sure our generate event will go through
		switch (event.action) {
		case this.data.actions.WINGED_MUSE.id:
			this.portraitGauge.generate(MOOGLE_PORTRAIT)
			break
		case this.data.actions.FANGED_MUSE.id:
			this.portraitGauge.generate(MADEEN_PORTRAIT)
			break
		}
	}

	private onComplete() {
		// Suggestions and stuff
	}
}

