import {observable, action} from 'mobx'
import {Ref} from 'react'

export class SidebarStore {
	@observable.ref reportLinkRef?: Ref<HTMLDivElement>

	// TODO: Migrate breadcrumb state in here

	@action
	setReportLinkRef(ref?: Ref<HTMLDivElement>) {
		this.reportLinkRef = ref
	}
}

export const sidebarStore = new SidebarStore()
