import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'

export default class Elements extends Analyser {
	@dependency data!: Data

	public readonly fireSpells: number[] = [
		this.data.actions.FIRE_I.id,
		this.data.actions.FIRE_II.id,
		this.data.actions.FIRE_III.id,
		this.data.actions.FIRE_IV.id,
		this.data.actions.FLARE.id,
		this.data.actions.DESPAIR.id,
	]

	/** Defining these lists separately since Gauge will need to treat the spells that must do damage to affect gauge differently from Umbral Soul */
	public readonly untargetedIceSpells: number[] = [
		this.data.actions.UMBRAL_SOUL.id,
	]
	public readonly targetedIceSpells: number[] = [
		this.data.actions.BLIZZARD_I.id,
		this.data.actions.BLIZZARD_II.id,
		this.data.actions.BLIZZARD_III.id,
		this.data.actions.BLIZZARD_IV.id,
		this.data.actions.FREEZE.id,

	]
	public readonly iceSpells: number[] = [
		...this.untargetedIceSpells,
		...this.targetedIceSpells,
	]
}
