import ACTIONS from 'data/ACTIONS'
import {Tincture} from 'parser/core/modules/Tincture'

// seems overboard, but the core module has INFUSION_STR already set
// I'm overriding in case someone reviews and thinks that's too specific
// for core
export default class SamTincture extends Tincture {
	buffAction = ACTIONS.INFUSION_STR
}
