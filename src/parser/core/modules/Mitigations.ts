import Module, {executeBeforeDoNotUseOrYouWillBeFired} from 'parser/core/Module'
import {isDefined} from 'utilities'
import {AdditionalEvents} from './AdditionalEvents'
import {SimpleRow, StatusItem} from './Timeline'

// Are other jobs going to need to add to this?
const MITIGATIONS = [
  {key: 'REPRISAL'},
  {key: 'HEART_OF_LIGHT'},
  {key: 'DARK_MISSIONARY'},
  {key: 'DIVINE_VEIL_PROC'},
  {key: 'ARMS_UP'},
  {key: 'PASSAGE_OF_ARMS'},
  {key: 'SHAKE_IT_OFF'},
  {key: 'SHIELD_SAMBA'},
  {key: 'ADDLE'},
  {key: 'TACTICIAN'},
  {key: 'TROUBADOUR'},
  {key: 'TEMPERANCE_MITIGATION'},
  {key: 'WHEEL_OF_FORTUNE_NOCTURNAL'},
  {key: 'COLLECTIVE_UNCONSCIOUS_DIURNAL_MITIGATION'},
  {key: 'SACRED_SOIL'},
  {key: 'FEY_ILLUMINATION'},
]

@executeBeforeDoNotUseOrYouWillBeFired(AdditionalEvents)
class MitigationsQuery extends Module {
	static handle = 'mitigationsQuery'
	static dependencies = [
		'additionalEventQueries',
		'data',
		'enemies',
	]

	normalise(events) {
		// Abilities we need more info on
		const abilities = [
			this.data.statuses.REPRISAL.id,
      this.data.statuses.ADDLE.id,
		]

		this.additionalEventQueries.registerQuery(`type in ('applydebuff','removedebuff') and ability.id in (${abilities.join(',')}) and (${this._buildActiveTargetQuery()})`)
		return events
	}

	// We only want events on "active" targets - lots of mirror copies used for mechanics that fluff up the data otherwise
	_buildActiveTargetQuery = () =>
		Object.keys(this.enemies.activeTargets)
			.map(actorId => {
				const actor = this.enemies.getEntity(Number(actorId))
				if (!actor) {
					return
				}

				const instances = this.enemies.activeTargets[actorId]
				let query = '(target.id=' + actor.guid
				if (instances.size > 0) {
					query += ` and target.instance in (${Array.from(instances).join(',')})`
				}
				return query + ')'
			})
			.filter(isDefined)
			.join(' or ')
}
export {MitigationsQuery}

export default class Mitigations extends Module {
	static handle = 'mitigations'
	static dependencies = [
		'data',
		'enemies',
		'timeline',
	]

	_mitigations = {}

	_mitigationRows = new Map()

	_mitigationMap = new Map()

	constructor(...args) {
		super(...args)

    console.log(this.data.statuses);

		MITIGATIONS.forEach(obj => {
			this._mitigationMap.set(this.data.statuses[obj.key].id, obj)
		})

		// Event hooks
		const filter = {abilityId: [...this._mitigationMap.keys()]}
		this.addEventHook('applybuff', {...filter, to: 'player'}, this._onApply)
		this.addEventHook('applydebuff', filter, this._onApply)
		this.addEventHook('removebuff', {...filter, to: 'player'}, this._onRemove)
		this.addEventHook('removedebuff', filter, this._onRemove)
		this.addEventHook('complete', this._onComplete)
	}

	_onApply(event) {
		// Only track active enemies when it's a debuff
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		const mitigations = this.getTargetMitigations(event.targetID)
		const statusId = event.ability.guid
		const settings = this._mitigationMap.get(statusId)

		if (settings.exclude && settings.exclude.includes(this.parser.actor.job)) {
			return
		}

		// Record the start time of the status
		mitigations[statusId] = event.timestamp - this.parser.eventTimeOffset
	}

	_onRemove(event) {
		// Only track active enemies
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		this._endStatus(event.targetID, event.ability.guid)
	}

	_endStatus(targetId, statusId) {
		const targetMitigations = this.getTargetMitigations(targetId)
		const applyTime = targetMitigations[statusId]
		// This shouldn't happen, but it do.
		if (!applyTime) { return }
		delete targetMitigations[statusId]

		const removeTime = this.parser.currentTimestamp - this.parser.eventTimeOffset

		const settings = this._mitigationMap.get(statusId)
		const status = this.data.getStatus(statusId)
		if (!status) { return }

		// Get the row for this buff/group, creating one if it doesn't exist yet.
		// NOTE: Using application time as order, as otherwise adding here forces ordering by end time of the first buff
		const rowId = settings.group || statusId
		let row = this._mitigationRows.get(rowId)
		if (row == null) {
			row = new SimpleRow({
				label: settings.name || status.name,
				order: applyTime,
			})
			this._mitigationRows.set(rowId, row)
		}

		// Add an item for the buff to its row
		row.addItem(new StatusItem({
			start: applyTime,
			end: removeTime,
			status,
		}))
	}

	_onComplete() {
		// Clean up any remnant statuses
		Object.entries(this._mitigations).forEach(([targetId, mitigations]) =>
			Object.keys(mitigations).forEach(mitigationId =>
				this._endStatus(targetId, Number(mitigationId)),
			),
		)

		// Add the parent row. It will automatically hide if there's no children.
		this.timeline.addRow(new SimpleRow({
			label: 'Mitigations',
			order: -101,
      collapse: true,
			rows: Array.from(this._mitigationRows.values()),
		}))
	}

	getTargetMitigations(targetId) {
		return this._mitigations[targetId] = this._mitigations[targetId] || {}
	}
}
