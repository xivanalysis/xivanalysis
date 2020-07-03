import {Action} from 'data/ACTIONS'
import {Status, STATUS_ID_OFFSET} from 'data/STATUSES'

interface MockAction extends Omit<Action, 'statusesApplied'> {
	statusesApplied?: string[]
}

export class MockedData {
	private actionData: MockAction[] = []
	private statusData: Status[] = []

	getAction(id: Action['id']) {
		return this.actionData.find(a => a.id === id)
	}

	getStatus(id: Status['id']) {
		return this.statusData.find(a => a.id + STATUS_ID_OFFSET === id)
	}

	getActionThatAppliesStatus(status: Status) {
		return this.actionData.find(a => a.statusesApplied && a.statusesApplied.includes(status.name))
	}

	mockAction(action: MockAction) {
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
