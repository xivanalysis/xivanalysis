import type {LinguiConfig} from '@lingui/conf'
import {formatter} from '@lingui/format-json'

const config: LinguiConfig = {
	catalogs: [{
		path: "<rootDir>/locale/{locale}/messages",
		include: ["<rootDir>/src"],
		exclude: ["**/*.d.ts"],
	}],
	locales: ["de", "en", "fr", "ja", "ko", "zh"],
	sourceLocale: "en",
	fallbackLocales: {
		default: "en",
	},
	orderBy: 'messageId',
	format: formatter({style: 'minimal'}),
}

// eslint-disable-next-line import/no-default-export
export default config
