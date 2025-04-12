import {observable, action} from 'mobx'
import {RefObject} from 'react'

export class SidebarStore {
	@observable.ref accessor reportLinkRef: RefObject<HTMLDivElement> | undefined

	// TODO: Migrate breadcrumb state in here

	@action
	setReportLinkRef(ref?: RefObject<HTMLDivElement>) {
		this.reportLinkRef = ref
	}
}

export const sidebarStore = new SidebarStore()
