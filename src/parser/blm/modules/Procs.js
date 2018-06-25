import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

export default class Procs extends Module {
	static dependencies = [
		'castTime',
		'gcd',
		'suggestions'
	]
	name = 'Proc Cast Times'

    _firestarter = null
    _thundercloud = null

	on_removebuff_byPlayer(event) {
        switch(event.ability.guid)
        {
            case STATUSES.THUNDERCLOUD.id:
                if(this._thundercloud !== null)
                {
                    this.castTime.reset(this._thundercloud)
                    this._thundercloud = null
                }
                break;
            case STATUSES.FIRESTARTER.id:
                if(this._firestarter !== null)
                {
                    this.castTime.reset(this._firestarter)
                    this._firestarter = null
                }
                break;
            default:
                break;
        }
	}

    // TODO: This approach probably incorrectly counts hardcast thunder as instant if you gain thundercloud mid cast
	on_applybuff_byPlayer(event) {
        const actionId = event.ability.guid
        
        switch(actionId)
        {
            case STATUSES.THUNDERCLOUD.id:
                // TODO: How do we make this set cast time for all thunder versions?
                this._thundercloud = this.castTime.set([ACTIONS.THUNDER_3.id], 0);
                break;
            case STATUSES.FIRESTARTER.id:
                this._firestarter = this.castTime.set([ACTIONS.FIRE_3.id], 0);
                break;
            default:
                break;
        }
	}
}
