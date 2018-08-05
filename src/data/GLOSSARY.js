import {i18nMark} from '@lingui/react'

const TERMS = {
	PROC: {
		i18n_id: i18nMark('glossary.proc.title'),
		text: 'proc',

		i18n_description: i18nMark('glossary.proc.description'),
		description: `Proc is a term used in gaming to refer to an event (a "procedure") that is triggered under certain circumstances.

For example, [~action/VERTHUNDER] has a 50% chance of triggering the status [~status/VERFIRE_READY] when cast.`,
	},
	GCD: {
		i18n_id: i18nMark('core.glossary.gcd'),
		text: 'gcd',

		i18n_description: i18nMark('core.glossary.gcd-description'),
		description: `GCD is the abbreviation of "Global Cooldown". It's the time that has to pass until an Action that falls under it can be used again. The default time for it is 2.50 seconds.

		An example for a GCD would be [~action/FIRE].`,
	},
	OGCD: {
		i18n_id: i18nMark('core.glossary.ogcd'),
		text: 'ogcd',

		i18n_description: i18nMark('core.glossary.ogcd-description'),
		description: `oGCD stands for "off Global Cooldown" and refers to actions which do not fall under the GCD time. Many of them are special abilities or buffs with a way longer cooldown than GCD skills. oGCDs come up very often, when it's about which actions to weave.

		An example for a oGCD would be [~action/FOES_REQUIEM].`,
	},
	WEAVING: {
		i18n_id: i18nMark('core.glossary.weaving'),
		text: 'WEAVING',

		i18n_description: i18nMark('core.glossary.weaving-description'),
		description: `Weaving refers to using one or more oGCD action while the GCD is already running down.  Players usually talk about either single, or double weaving, which refers to using either one or two oGCDs after a GCD. It is commonly used since oGCD actions have varying animation locks which would prevent casting another GCD during it. So weaving is an effort to always keep the GCD rolling (ABC). This also means GCD actions with cast times that are as long or nearly as long as a GCD can't be used for weaving.
		An example for a single weave would be using [~action/DREADWYRM_TRANCE] while the GCD for [~action/RUIN_II] is running.`,
	},
}

export default TERMS
