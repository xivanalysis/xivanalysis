import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {RotationEvent} from 'components/ui/Rotation'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {ActionWindow, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {Actors} from 'parser/core/modules/Actors'
import {Message} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {EsteemUsageEvaluator} from './EsteemUsageEvaluator'

const ESTEEM_LEVEL_80: ActionKey[] = [
	'ESTEEM_ABYSSAL_DRAIN',
	'ESTEEM_SHADOWSTRIDE',
	'ESTEEM_FLOOD_OF_SHADOW',
	'ESTEEM_EDGE_OF_SHADOW',
	'ESTEEM_BLOODSPILLER',
	'ESTEEM_CARVE_AND_SPIT',
]

const ESTEEM_LEVEL_90: ActionKey[] = [
	'ESTEEM_ABYSSAL_DRAIN',
	'ESTEEM_SHADOWSTRIDE',
	'ESTEEM_SHADOWBRINGER',
	'ESTEEM_EDGE_OF_SHADOW',
	'ESTEEM_BLOODSPILLER',
	'ESTEEM_CARVE_AND_SPIT',
]

const ESTEEM_LEVEL_100: ActionKey[] = [
	'ESTEEM_ABYSSAL_DRAIN',
	'ESTEEM_SHADOWSTRIDE',
	'ESTEEM_SHADOWBRINGER',
	'ESTEEM_EDGE_OF_SHADOW',
	'ESTEEM_BLOODSPILLER',
	'ESTEEM_DISESTEEM',
]

// Esteem actions that will have the same potency at any level.
// In theory, any of these could be intermingled without a potency loss.
// In practice, the only action that can really be doubled is Abyssal Drain,
// but sequences like the following are valid at level 100:
// Abyssal Drain -> Shadowstride -> Shadowbringer -> Abyssal Drain -> Bloodspiller -> Disesteem
const EQUIVALENT_ACTIONS: ActionKey[] = [
	'ESTEEM_ABYSSAL_DRAIN',
	'ESTEEM_EDGE_OF_SHADOW',
	'ESTEEM_BLOODSPILLER',
	'ESTEEM_FLOOD_OF_SHADOW',
	'ESTEEM_CARVE_AND_SPIT',
]

export class EsteemWindow extends ActionWindow {
	static override handle = 'esteem'
	static override title = msg({id: 'drk.esteem.rotation.window.title', message: 'Actions Used By Esteem (Living Shadow)'})
	static override displayOrder = DISPLAY_ORDER.ESTEEM_WINDOW
	static LIVING_SHADOW_ACTION_KEY: ActionKey = 'LIVING_SHADOW'
	override prependMessages = <Message>
		<Trans id="drk.esteem.rotation.window.description">
				This shows the actions used by Esteem following each use of <DataLink action="LIVING_SHADOW" />. If uninterrupted, at level 100, Esteem will use the following six abilities in order: <DataLink action="ABYSSAL_DRAIN" />, <DataLink action="SHADOWSTRIDE" />, <DataLink action="SHADOWBRINGER" />, <DataLink action="EDGE_OF_SHADOW" />, <DataLink action="BLOODSPILLER" />, <DataLink action="DISESTEEM" />. Less than six abilities indicates Esteem did not get all of its attacks off on an enemy, such as due to the boss phasing. Duplicate abilities indicate that Esteem was out of range at one or more points during its attacks. Both can be significant potency losses.
		</Trans>
	</Message>

	@dependency private actors!: Actors

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const pets = this.parser.pull.actors.filter(actor => actor.owner === this.parser.actor).map(actor => actor.id)

		const playerActionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
		const esteemActionFilter = filter<Event>()
			.source(oneOf(pets))
			.type('action')
		this.setEventFilter((event): event is Events['action'] => {
			if (playerActionFilter(event)) {
				return event.action === this.data.actions[EsteemWindow.LIVING_SHADOW_ACTION_KEY].id
			}
			return esteemActionFilter(event)
		})

		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId([EsteemWindow.LIVING_SHADOW_ACTION_KEY])), this.beginEsteem)

		this.addEvaluator(new EsteemUsageEvaluator({
			suggestionIcon: this.data.actions.LIVING_SHADOW.icon,
			esteemActionIds: ESTEEM_LEVEL_100.map(k => this.data.actions[k].id),
			esteemActionIds90: ESTEEM_LEVEL_90.map(k => this.data.actions[k].id),
			esteemActionIds80: ESTEEM_LEVEL_80.map(k => this.data.actions[k].id),
			equivalentActionIds: EQUIVALENT_ACTIONS.map(k => this.data.actions[k].id),
			// We pass the level as a func dynamically so that it is actually populated
			actorLevelFunc: () => this.actors.get(this.parser.actor).level,
		}))
	}

	override getRotationOutputForAction(action: EvaluatedAction): RotationEvent {
		// Let's make the actions have real icons and tooltips
		if (action.action.id === this.data.actions.ESTEEM_ABYSSAL_DRAIN.id) {
			return {action: this.data.actions.ABYSSAL_DRAIN.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_SHADOWSTRIDE.id) {
			return {action: this.data.actions.SHADOWSTRIDE.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_SHADOWBRINGER.id) {
			return {action: this.data.actions.SHADOWBRINGER.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_EDGE_OF_SHADOW.id) {
			return {action: this.data.actions.EDGE_OF_SHADOW.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_BLOODSPILLER.id) {
			return {action: this.data.actions.BLOODSPILLER.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_DISESTEEM.id) {
			return {action: this.data.actions.DISESTEEM.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_FLOOD_OF_SHADOW.id) {
			return {action: this.data.actions.FLOOD_OF_SHADOW.id, forceGCDSizeAndStyle: true}
		}
		if (action.action.id === this.data.actions.ESTEEM_CARVE_AND_SPIT.id) {
			return {action: this.data.actions.CARVE_AND_SPIT.id, forceGCDSizeAndStyle: true}
		}
		return {action: action.action.id}
	}

	private beginEsteem(event: Events['action']) {
		// Forcibly close any open windows, i.e. each Esteem Window is until the next Living Shadow is used
		this.onWindowEnd(event.timestamp)
		// Then start the new window
		this.onWindowStart(event.timestamp)
	}

}
