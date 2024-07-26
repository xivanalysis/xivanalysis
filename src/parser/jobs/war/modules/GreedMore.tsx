import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'

export class GreedMore extends CoreDisengageGcds {
	protected override trackedAction = this.data.actions.TOMAHAWK
}
