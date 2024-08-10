import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React, {ReactNode} from 'react'
import {ensureRecord} from 'utilities'
import {BLMGaugeState} from '../Gauge'

export const DEFAULT_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export const ENHANCED_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export const FLARE_STAR_CARRYOVER_CODE = -2

export interface CycleErrorCode {priority: number, message: ReactNode}
export const DEATH_PRIORITY = 101 // Define this const here so we can reference it in both classes
export const HIDDEN_PRIORITY_THRESHOLD = 2 // Same as ^
/**
 * Error type codes, higher values indicate higher priority errors. If you add more, adjust the IDs to ensure correct priorities.
 * Only the highest priority error will be displayed in the 'Reason' column.
 * NOTE: Cycles with values at or below HIDDEN_PRIORITY_THRESHOLD will be filtered out of the RotationTable display
 * unless the DEBUG_SHOW_ALL variable is set to true
 */
export const ROTATION_ERRORS = ensureRecord<CycleErrorCode>()({
	NO_ERROR: {priority: 0, message: 'No errors'},
	FINAL_OR_DOWNTIME: {priority: 1, message: 'Ended with downtime, or last cycle'},
	SHORT: {priority: HIDDEN_PRIORITY_THRESHOLD, message: 'Too short, won\'t process'},
	// Messages below should be Trans objects since they'll be displayed to end users
	SHOULD_SKIP_T3: {priority: 8, message: <Trans id="blm.rotation-watchdog.error-messages.should-skip-t3">Should skip hardcast <DataLink action="THUNDER_III"/></Trans>},
	MISSING_FIRE4S: {priority: 10, message: <Trans id="blm.rotation-watchdog.error-messages.missing-fire4s">Missing one or more <DataLink action="FIRE_IV"/>s</Trans>}, // These three errors are lower priority since they can be determined by looking at the
	MISSED_ICE_PARADOX: {priority: 15, message: <Trans id="blm.rotation-watchdog.error-messages.missed-ice-paradox">Missed <DataLink action="PARADOX"/> in Umbral Ice</Trans>},
	MISSING_DESPAIRS: {priority: 20, message: <Trans id="blm.rotation-watchdog.error-messages.missing-despair">Missing one or more <DataLink action="DESPAIR"/>s</Trans>}, // target columns in the table, so we want to tell players about other errors first
	MISSING_FLARE_STARS: {priority: 30, message: <Trans id="blm.rotation-watchdog.error-messages.missing-flarestars">Missing one or more <DataLink action="FLARE_STAR"/>s</Trans>},
	MANAFONT_BEFORE_DESPAIR: {priority: 40, message: <Trans id="blm.rotation-watchdog.error-messages.manafont-before-despair"><DataLink action="MANAFONT"/> used before <DataLink action="DESPAIR"/></Trans>},
	EXTRA_F1: {priority: 60, message: <Trans id="blm.rotation-watchdog.error-messages.extra-f1">Extra <DataLink action="FIRE_I"/></Trans>}, // These two codes should stay close to each other
	NO_FIRE_SPELLS: {priority: 80, message: <Trans id="blm.rotation-watchdog.error-messages.no-fire-spells">Rotation included no Fire spells</Trans>},
	DROPPED_AF_UI: {priority: 100, message: <Trans id="blm.rotation-watchdog.error-messages.dropped-astral-umbral">Dropped Astral Fire or Umbral Ice</Trans>},
	DIED: {priority: DEATH_PRIORITY, message: <Trans id="blm.rotation-watchdog.error-messages.died"><DataLink showName={false} action="RAISE"/> Died</Trans>},
})

export interface CycleMetadata {
	errorCode: CycleErrorCode
	finalOrDowntime: boolean
	missingDespairs: boolean
	missingFire4s: boolean
	missingFlareStars: boolean
	expectedFire4s: number,
	expectedDespairs: number,
	expectedFlareStars: number,
	firePhaseMetadata: PhaseMetadata
}

export interface PhaseMetadata {
	startTime: number
	initialMP: number
	initialGaugeState: BLMGaugeState
	fullElementTime: number
	fullElementMP: number
	fullElementGaugeState: BLMGaugeState
	circleOfPowerPct: number
}
