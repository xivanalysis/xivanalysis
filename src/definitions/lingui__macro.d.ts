import {PluralProps} from '@lingui/macro/select'

// Probably should PR this to DT, too...
declare module '@lingui/macro' {
	export interface MessageDescriptor {
		id: string
		defaults?: string
		values?: {[key: string]: any}
	}

	export function t(strings: TemplateStringsArray, ...values: any[]): MessageDescriptor
	export function t(id: string): (strings: TemplateStringsArray, ...values: any[]) => MessageDescriptor

	export function plural(config: PluralProps): MessageDescriptor
	export function plural(id: string, config: PluralProps): MessageDescriptor
}
