/* eslint-disable @typescript-eslint/no-magic-numbers */
import {msg} from '@lingui/core/macro'
import {ActionKey} from 'data/ACTIONS'
// import {Events} from 'event'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ActionWindow} from 'parser/core/modules/ActionWindow'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {EsteemUsageEvaluator} from './EsteemUsageEvaluator'

// TODO Violet other levels
const ESTEEM_LEVEL_100: ActionKey[] = [
	'ESTEEM_ABYSSAL_DRAIN',
	'ESTEEM_SHADOWSTRIDE',
	'ESTEEM_SHADOWBRINGER',
	'ESTEEM_EDGE_OF_SHADOW',
	'ESTEEM_BLOODSPILLER',
	'ESTEEM_DISESTEEM',
]

export class EsteemWindow extends ActionWindow {
	static override handle = 'esteem'
	static override title = msg({id: 'drk.esteemwindow.title', message: 'Esteem Action Usage'})
	static override displayOrder = DISPLAY_ORDER.ESTEEM_WINDOW
	static LIVING_SHADOW_ACTION_KEY: ActionKey = 'LIVING_SHADOW'
	static livingShadowActionId = 16472
	// Abyssal Drain, Shadowstride, Shadowbringer, Edge, Bloodspiller, Disesteem
	static esteemActionIds100 = [17904, 38512, 25881, 17909, 17908, 36933]

	@dependency globalCooldown!: GlobalCooldown

	// override buffStatus = this.data.statuses.BLOOD_WEAPON
	// override endOfWindowHandlingMode: EndOfWindowHandlingMode = 'SAME-TIMESTAMP'

	override initialise() {
		super.initialise()

		const ids = ESTEEM_LEVEL_100.map(k => this.data.actions[k].id)
		this.trackOnlyActions(ids)
		//this.trackOnlyActions(EsteemWindow.esteemActionIds100)
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId([EsteemWindow.LIVING_SHADOW_ACTION_KEY])), this.beginEsteem)

		this.addEvaluator(new EsteemUsageEvaluator({
			suggestionIcon: this.data.actions.LIVING_SHADOW.icon,
			esteemActionIds: ids,
		}))

		// this.addEvaluator(new ExpectedActionGroupsEvaluator({
		// 			expectedActionGroups: [
		// 				{
		// 					actions: [this.data.actions.SCARLET_DELIRIUM, this.data.actions.COMEUPPANCE, this.data.actions.TORCLEAVER, this.data.actions.IMPALEMENT],
		// 					expectedPerWindow: 3,
		// 					overrideHeader: <DataLink showName={false} action="DELIRIUM" />,
		// 				},
		// 				{
		// 					actions: [this.data.actions.BLOODSPILLER, this.data.actions.QUIETUS],
		// 					expectedPerWindow: 2,
		// 				},
		// 				{
		// 					actions: [this.data.actions.SHADOWBRINGER],
		// 					expectedPerWindow: 2,
		// 				},
		// 				{
		// 					actions: [this.data.actions.CARVE_AND_SPIT, this.data.actions.ABYSSAL_DRAIN],
		// 					expectedPerWindow: 1,
		// 				},
		// 				{
		// 					actions: [this.data.actions.DISESTEEM],
		// 					expectedPerWindow: 1,
		// 				},
		// 				{
		// 					actions: [this.data.actions.EDGE_OF_SHADOW, this.data.actions.FLOOD_OF_SHADOW],
		// 					expectedPerWindow: 5,
		// 				},
		// 			],
		// 			suggestionIcon: this.data.actions.INFUSION_STR.icon,
		// 			suggestionContent: <Trans id="gnb.tincture.suggestions.trackedActions.content">
		// 				Try to cover as much damage as possible with your Tinctures of Strength.
		// 			</Trans>,
		// 			suggestionWindowName: <DataLink item="INFUSION_STR" showIcon={false}/>,
		// 			severityTiers: {
		// 				1: SEVERITY.MINOR,
		// 				2: SEVERITY.MEDIUM,
		// 				3: SEVERITY.MAJOR,
		// 			},
		// 			adjustCount: this.adjustExpectedBloodspillerCount.bind(this),
		// 		}))

		// this.addEvaluator(new ExpectedGcdCountEvaluator({
		// 	expectedGcds: 5,
		// 	globalCooldown: this.globalCooldown,
		// 	hasStacks: true,
		// 	suggestionIcon: this.data.actions.BLOOD_WEAPON.icon,
		// 	suggestionContent: <Trans id="drk.bloodweapon.suggestions.missedgcd.content">
		// 		Try to land 5 GCDs during every <ActionLink action="BLOOD_WEAPON" /> window.  If you cannot do this with full uptime and no clipping, consider adjusting your gearset for more Skill Speed.
		// 	</Trans>,
		// 	suggestionWindowName: <ActionLink action="BLOOD_WEAPON" showIcon={false}/>,
		// 	severityTiers: {
		// 		1: SEVERITY.MINOR,
		// 		3: SEVERITY.MEDIUM,
		// 		5: SEVERITY.MAJOR,
		// 	},
		// }))
	}

	private beginEsteem(event: Events['action']) {
		// Forcibly close any open windows, i.e. each Esteem Window is until the next Living Shadow is used
		this.onWindowEnd(event.timestamp)
		// Then start the new window
		this.onWindowStart(event.timestamp)
	}

}
