import {Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from '../Injectable'
import {Data} from './Data'
import {SimpleRow, StatusItem, Timeline} from './Timeline'

interface Medication {
	start: number
	end?: number
}

export class Medicated extends Analyser {
	static override handle = 'medicated'

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private pot: Medication | undefined
	private pots: Medication[] = []

	override initialise() {
		this.addEventHook({
			type: 'statusApply',
			target: this.parser.actor.id,
			status: this.data.statuses.MEDICATED.id,
		}, this.onMedication)

		this.addEventHook({
			type: 'statusRemove',
			target: this.parser.actor.id,
			status: this.data.statuses.MEDICATED.id,
		}, this.offMedication)

		this.addEventHook('complete', this.onComplete)
	}

	private onMedication(event: Events['statusApply']) {
		this.pot = {start: event.timestamp}
	}

	private stopAndSave(endTime: number = this.parser.currentEpochTimestamp) {
		if (this.pot != null) {
			this.pots.push({...this.pot, end: endTime})
		}

		this.pot = undefined
	}

	private offMedication(event: Events['statusRemove']) {
		if (this.pot == null) {
			throw new Error('potion instance not found')
		}

		this.stopAndSave(event.timestamp)
	}

	private onComplete() {
		const status = this.data.statuses.MEDICATED

		// Add a pot that is still up before end of pull
		if (this.pot != null && this.pot.end == null) {
			this.stopAndSave()
		}

		if (this.pots.length > 0) {
			const row = new SimpleRow({
				label: 'Medicated',
				order: -99,
			})

			this.pots.forEach(pot => row.addItem(new StatusItem({
				status: status,
				start: pot.start - this.parser.pull.timestamp,
				end: pot.end != null ? pot.end - this.parser.pull.timestamp : this.parser.pull.duration,
			})))

			this.timeline.addRow(row)
		}
	}
}
