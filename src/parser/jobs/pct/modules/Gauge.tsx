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
const WEAPON_MOTIF = 'weapon'
const LANDSCAPE_MOTIF = 'landscape'

const MOOGLE_PORTRAIT = 'moogle'
const MADEEN_PORTRAIT = 'madeen'

/** Graph colors/fade settings */
const PALETTE_GAUGE_COLOR = Color(JOBS.PICTOMANCER.colour).fade(GAUGE_FADE)
const WHITE_PAINT_COLOR = Color(JOBS.WHITE_MAGE.colour).fade(GAUGE_FADE)
const BLACK_PAINT_COLOR = Color(JOBS.BLACK_MAGE.colour).fade(GAUGE_FADE)
const CREATURE_MOTIF_COLOR = Color(JOBS.SUMMONER.colour).fade(GAUGE_FADE)
const WEAPON_MOTIF_COLOR = Color(JOBS.WARRIOR.colour).fade(GAUGE_FADE)
const LANDSCAPE_MOTIF_COLOR = Color(JOBS.PALADIN.colour).fade(GAUGE_FADE)
const CREATURE_CANVAS_COLOR = Color(JOBS.BARD.colour).fade(GAUGE_FADE)
const MOOGLE_COLOR = Color(JOBS.DANCER.colour).fade(GAUGE_FADE)
const MADEEN_COLOR = Color(JOBS.SAGE.colour).fade(GAUGE_FADE)

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

	private whitePaintModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.WATER_IN_BLUE.id, {damage: 1}],
		[this.data.actions.WATER_II_IN_BLUE.id, {damage: 1}],
		[this.data.actions.THUNDER_IN_MAGENTA.id, {damage: 1}],
		[this.data.actions.THUNDER_II_IN_MAGENTA.id, {damage: 1}],
		[this.data.actions.RAINBOW_DRIP.id, {damage: 1}],

		// Spenders
		[this.data.actions.SUBTRACTIVE_PALLETTE.id, {action: -1}],
		[this.data.actions.HOLY_IN_WHITE.id, {action: -1}],
	])

	private blackPaintModifiers = new Map<number, GaugeModifier>([
		// Builders
		[this.data.actions.SUBTRACTIVE_PALLETTE.id, {action: 1}],

		// Spenders
		[this.data.actions.COMET_IN_BLACK.id, {action: -1}],
	])

	private motifGauge = this.add(new SetGauge({
		options: [
			{
				value: CREATURE_MOTIF,
				label: <Trans id="pct.canvasgauge.creature-motif.label">Creature Motif</Trans>,
				color: CREATURE_MOTIF_COLOR,
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

	private creatureCanvas = this.add(new CounterGauge({
		maximum: 3,
		graph: {
			label: <Trans id="pct.gauge.resource.creature">Creature Canvas</Trans>,
			color: CREATURE_CANVAS_COLOR,
		},
	}))

	private creatureCanvasModifiers = new Map<number, GaugeModifier>([
		[this.data.actions.POM_MUSE.id, {action: 1}],
		[this.data.actions.WINGED_MUSE.id, {action: 2}],
		[this.data.actions.CLAWED_MUSE.id, {action: 3}],
		[this.data.actions.FANGED_MUSE.id, {action: 0}],
	])

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
			handle: 'paintgauge',
			label: <Trans id="pct.gauge.resource.paint">Paint</Trans>,
			tooltipHideWhenEmpty: true,
		},
	}))

	private portraitGaugeModifers = [
		this.data.actions.WINGED_MUSE.id,
		this.data.actions.MOG_OF_THE_AGES.id,
		this.data.actions.FANGED_MUSE.id,
		this.data.actions.RETRIBUTION_OF_THE_MADEEN.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		const paletteActions = Array.from(this.paletteGaugeModifiers.keys())
		this.addEventHook(playerFilter.action(oneOf(paletteActions)), this.onPaletteModifer)

		const whitePaintActions = Array.from(this.whitePaintModifiers.keys())
		this.addEventHook(playerFilter.action(oneOf(whitePaintActions)), this.onWhitePaintModifier)

		const blackPaintActions = Array.from(this.blackPaintModifiers.keys())
		this.addEventHook(playerFilter.action(oneOf(blackPaintActions)).type('action'), this.onBlackPaintModifier)

		const creatureMotifActions = Array.from(this.motifModifiers.keys())
		this.addEventHook(playerFilter.action(oneOf(creatureMotifActions)).type('action'), this.onMotifModifier)

		const creatureCanvasActions = Array.from(this.creatureCanvasModifiers.keys())
		this.addEventHook(playerFilter.action(oneOf(creatureCanvasActions)).type('action'), this.onCreatureCanvasModifier)

		const portaitActions = Array.from(this.portraitGaugeModifers.keys())
		this.addEventHook(playerFilter.action(oneOf(portaitActions)).type('action'), this.onPortraitModifier)

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

		// Subtractive Pallet does not spend gauge if Subtrative Spectrum is currently active
		if (eventActionId === this.data.actions.SUBTRACTIVE_PALLETTE.id &&
			this.actors.current.hasStatus(this.data.statuses.SUBTRACTIVE_SPECTRUM.id)) {
			return
		}

		const modifier = this.paletteGaugeModifiers.get(eventActionId)
		if (modifier == null) { return }

		this.paletteGauge.modify(modifier[event.type] ?? 0)
	}

	private onWhitePaintModifier(event: Event) {
		let eventActionId
		if (event.type === 'damage' && event.cause.type === 'action') {
			eventActionId = event.cause.action
		} else if (event.type === 'action') {
			eventActionId = event.action
		}
		if (eventActionId == null) { return }

		const modifier = this.blackPaintModifiers.get(eventActionId)
		if (modifier == null) { return }

		const delta = modifier[event.type]
		if (delta == null) { return }

		if (delta > 0) {
			this.paintGauge.generate(BLACK_PAINT, delta)
		} else {
			this.paintGauge.spend(BLACK_PAINT, Math.abs(delta))
		}
	}

	private onBlackPaintModifier(event: Events['action']) {
		const modifier = this.blackPaintModifiers.get(event.action)
		if (modifier == null) { return }

		const delta = modifier[event.type]
		if (delta == null) { return }

		if (delta > 0) {
			this.paintGauge.generate(BLACK_PAINT, delta)
		} else {
			this.paintGauge.spend(BLACK_PAINT, Math.abs(delta))
		}
	}

	private onMotifModifier(event: Events['action']) {
		const modifier = this.motifModifiers.get(event.action)
		if (modifier == null) { return }

		const motifMod = modifier[event.type]
		if (motifMod == null) { return }

		if (motifMod.type === 'generate') {
			this.motifGauge.generate(motifMod.which)
		} else if (motifMod.type === 'spend') {
			this.motifGauge.spend(motifMod.which)
		}
	}

	private onCreatureCanvasModifier(event: Events['action']) {
		const modifier = this.creatureCanvasModifiers.get(event.action)
		if (modifier == null) { return }

		const value = modifier[event.type]
		if (value == null) { return }

		// Using set for this gauge, since the game is pretty strict about the order of the creature motifs
		this.creatureCanvas.set(value)
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

