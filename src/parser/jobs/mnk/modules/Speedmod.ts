import {BuffEvent, AbilityType} from 'fflogs'
import {Event} from 'legacyEvent'

import {dependency} from 'parser/core/Module'
import {Data} from 'parser/core/modules/Data'
import PrecastStatus from 'parser/core/modules/PrecastStatus'

export default class Speedmod extends PrecastStatus {
	@dependency private data!: Data

	normalise(events: Event[]): Event[] {
		const greasedLighting = this.data.statuses.GREASED_LIGHTNING

		const event: BuffEvent = {
			type: 'applybuff',
			ability: {
				abilityIcon: '010000-010207.png',
				guid: greasedLighting.id,
				name: greasedLighting.name,
				type: AbilityType.PHYSICAL_DIRECT,
			},
			sourceID: this.parser.player.id,
			sourceIsFriendly: true,
			targetID: this.parser.player.id,
			targetIsFriendly: true,
			timestamp: this.parser.fight.start_time,
		}

		this.fabricateStatusEvent(event, greasedLighting)
		return super.normalise(events)
	}
}
