import {AoEAction, AoEUsages} from 'parser/core/modules/AoEUsages'

export class AoE extends AoEUsages {
	static override handle = 'aoe'

	suggestionIcon = this.data.actions.FATED_CIRCLE.icon

	/*
	This does NOT cover the following optimizing trick covered by Rin:
		While this isn't any specific fight knowledge, I realize I can't recall if I've ever said this tech before and it might prove useful here and there for peeps.
		Under the following conditions
			- Boss leaves in 3 GCDs
			- 3rd GCD Ghosts
			- Gnashing isn't up
			- You wish to end cartridge neutral
			- You were not mid combo:
		650p in 2 GCDs
		Burst Strike(500p), Demon Slice(150p), Demon Slaughter(0p Ghosts)
		Versus
		500p in 2 GCDs
		Keen Edge(200p), Brutal Shell(300p), Solid Barrel(0p Ghosts)
		If you would get all 3 GCDs with no ghosting then Both combos are 900 potency
	I consider this to be high level enough that if you are doing this, you know what you are doing.
	*/

	trackedActions: AoEAction[] = [
		{
			aoeAction: this.data.actions.DEMON_SLICE,
			stActions: [this.data.actions.KEEN_EDGE],
			minTargets: 3,
		},
		{
			aoeAction: this.data.actions.FATED_CIRCLE,
			stActions: [this.data.actions.BURST_STRIKE],
			minTargets: 2,
		},
	]

}

