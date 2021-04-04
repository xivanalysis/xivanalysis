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
	static handle = 'medicated'

	@dependency private data!: Data
	@dependency private timeline!: Timeline

	private pot: Medication | undefined
	private pots: Medication[] = []

	initialise() {
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
		this.pot = {start: event.timestamp - this.parser.pull.timestamp}
	}

	private offMedication(event: Events['statusRemove']) {
		// Pre-pull should handle if we're missing a start time
		if (!this.pot) {
			this.pot = {start: this.parser.pull.timestamp}
		}

		this.pots.push({end: event.timestamp - this.parser.pull.timestamp, ...this.pot})

		this.pot = undefined
	}

	private onComplete() {
		const status = this.data.statuses.MEDICATED
		if (!status) { return }

		if (this.pots.length > 0) {
			const row = new SimpleRow({
				label: 'Medicated',
				order: -99,
			})

			this.pots.forEach(pot => row.addItem(new StatusItem({
				status: status,
				start: pot.start,
				end: pot.end ?? (this.parser.pull.timestamp + this.parser.pull.duration),
			})))

			this.timeline.addRow(row)
		}
	}
}
