import {observable, action} from 'mobx'

export class SidebarStore {
	@observable.ref reportLinkRef?: React.Ref<HTMLDivElement>

	// TODO: Migrate breadcrumb state in here

	@action
	setReportLinkRef(ref?: React.Ref<HTMLDivElement>) {
		this.reportLinkRef = ref
	}
}

export const sidebarStore = new SidebarStore()
