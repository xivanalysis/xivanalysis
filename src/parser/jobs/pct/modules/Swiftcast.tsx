import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
	@dependency private actors!: Actors

	static override displayOrder = DISPLAY_ORDER.SWIFTCAST

	override suggestionContent = <Trans id="pct.swiftcast.missed.suggestion.content">Cast a spell with <DataLink action="SWIFTCAST" /> before it expires. This allows you to cast spells that have cast times instantly, such as using <DataLink showIcon={false} status="SWIFTCAST" />a motif for a long movement or weaving window, or <DataLink action="RAINBOW_DRIP" /> right before a boss dies or becomes untargetable.</Trans>

	protected override considerSwiftAction(action: Action): boolean {
		// Rainbow Drip is the only thing that can be instant not because of Swiftcast, always consider all other actions
		if (action.id !== this.data.actions.RAINBOW_DRIP.id) {
			return true
		}

		// Ignore Rainbow Drips that were used under Rainbow Bright, it takes precedence over Swiftcast
		return !this.actors.current.hasStatus(this.data.statuses.RAINBOW_BRIGHT.id)
	}
}
