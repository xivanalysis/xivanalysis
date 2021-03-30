import {ReportLanguage} from 'fflogs'

export enum GameEdition {
	GLOBAL,
	KOREAN,
	CHINESE,
}

export function languageToEdition(lang: ReportLanguage): GameEdition {
	switch (lang) {
	case ReportLanguage.JAPANESE:
	case ReportLanguage.ENGLISH:
	case ReportLanguage.GERMAN:
	case ReportLanguage.FRENCH:
		return GameEdition.GLOBAL

	case ReportLanguage.KOREAN:
		return GameEdition.KOREAN

	case ReportLanguage.CHINESE:
		return GameEdition.CHINESE

	// Fallback case for when fflogs borks
	// TODO: This probably will crop up in other places. Look into solving it higher up the chain.
	case ReportLanguage.UNKNOWN:
	case undefined:
		return GameEdition.GLOBAL
	}

	throw new Error(`Unknown report language "${lang}" received.`)
}
