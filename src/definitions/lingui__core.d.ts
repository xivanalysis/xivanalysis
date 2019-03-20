import {I18n, MessageOptions} from '@lingui/core'

declare module '@lingui/core' {
	export interface MessageDescriptor {
		id: string
		defaults?: string
		values?: {[key: string]: any}
	}

	// tslint:disable-next-line:interface-name
	export interface I18n {
		_(id: string | MessageDescriptor, values?: object, messageOptions?: MessageOptions): string
	}
}
