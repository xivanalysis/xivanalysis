import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'

export class DisengageGcds extends CoreDisengageGcds {
	protected override trackedAction = this.data.actions.TOMAHAWK
}
