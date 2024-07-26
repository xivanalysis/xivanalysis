import {DisengageGcds as CoreDisengageGcds} from 'parser/core/modules/DisengageGcds'

export class LightningShot extends CoreDisengageGcds {
	protected override trackedAction = this.data.actions.LIGHTNING_SHOT
}
