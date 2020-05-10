import Module from 'parser/core/Module'
import {Pet} from 'data/PETS'

export interface SummonPetEvent {
	type: 'summonpet'
	timestamp: number
	petId: number
}

declare module 'events' {
	interface EventTypeRepository {
		smnPets: SummonPetEvent
	}
}

export default class Pets extends Module {
	getPetUptimePercent(petId: number): string
	setPet(petId: number, timestamp?: number): void
	getCurrentPet(): Pet | undefined
	getPetName(petId: number): string
	isDemiPet(petId: number): boolean
}
