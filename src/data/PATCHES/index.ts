import {PATCHES} from './patches'

export default PATCHES

export {GameEdition, languageToEdition} from './editions'
export {Patch} from './Patch'
export type {PatchInfo, PatchNumber} from './patches'
export {getPatch, getPatchDate, getReportPatch, patchSupported} from './utilities'
