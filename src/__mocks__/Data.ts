import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'

export class MockedData {
	private actionData: Action[] = []
	private statusData: Status[] = []

	getAction(id: Action['id']) {
		return this.actionData.find(a => a.id === id)
	}

	getStatus(id: Status['id']) {
		return this.statusData.find(a => a.id === id)
	}

	mockAction(action: Action) {
		this.actionData.push(action)
	}

	mockStatus(status: Status) {
		this.statusData.push(status)
	}

	get actions() {
		const actionObject: {[key: string]: unknown} = {}
		this.actionData.forEach(action => actionObject[action.name] = action)
		return actionObject
	}

	get statuses() {
		const statusObject: {[key: string]: unknown} = {}
		this.statusData.forEach(status => statusObject[status.name] = status)
		return statusObject
	}
}
