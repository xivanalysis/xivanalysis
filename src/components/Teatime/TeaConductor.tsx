import {Conductor} from 'parser/Conductor'
import {Meta} from 'parser/core/Meta'
import GlobalCooldown from 'parser/core/modules/GlobalCooldown'
import Timeline from 'parser/core/modules/Timeline'
import Parser, {Result} from 'parser/core/Parser'
import {isDefined} from 'utilities'

import AdditionalEvents from 'parser/core/modules/AdditionalEvents'
import CastTime from 'parser/core/modules/CastTime'
import CoreCooldowns from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import Enemies from 'parser/core/modules/Enemies'
import {FFLogsEventNormaliser} from 'parser/core/modules/FFLogsEventNormaliser'
import Invulnerability from 'parser/core/modules/Invulnerability'
import PrecastAction from 'parser/core/modules/PrecastAction'
import PrecastStatus from 'parser/core/modules/PrecastStatus'
import RaidBuffs from 'parser/core/modules/RaidBuffs'
import Speedmod from 'parser/core/modules/Speedmod'
import {Statistics} from 'parser/core/modules/Statistics'
import UnableToAct from 'parser/core/modules/UnableToAct'

import AdditionalPartyEvents from './modules/AdditionalPartyEvents'
import EnemyAttacks from './modules/EnemyAttacks'
import Friendlies from './modules/Friendlies'
import PartyCooldowns from './modules/PartyCooldowns'

// Top level things I want
// timeline
// Cooldowns lite (defensive)
// Raidwide plus (defensive like addle / reprisal)

// PartyCooldowns requirements
// 'data'
// 'timeline'

// Downtime requirements <- removed, check dependencies
// 'invuln'
// 'unableToAct'

// Invulnerability requirements
// 'timeline'

const teaMeta = new Meta({
	modules: () => Promise.resolve({
		default: [
			Timeline,
			// GlobalCooldown,
			PrecastAction,
			CastTime,
			Data,
			Speedmod,
			FFLogsEventNormaliser,
			Invulnerability,
			UnableToAct,
			PrecastStatus,
			Statistics,
			PartyCooldowns,
			RaidBuffs,
			Enemies,
			AdditionalEvents,
			AdditionalPartyEvents,
			Friendlies,
			EnemyAttacks,
		],
	}),
	changelog: [],
})

export default class TeaConductor extends Conductor {
	async configure() {
		// Build the final meta representation
		const rawMetas = [
			teaMeta,
		]
		const meta = rawMetas
			.filter(isDefined)
			.reduce((acc, cur) => acc.merge(cur))

		// Build the base parser instance
		const parser = new Parser({
			meta,
			report: this.report,
			fight: this.fight,
			actor: this.combatant,
		})

		// Get the parser all built up and stuff
		await parser.configure()

		this.parser = parser
	}
}
