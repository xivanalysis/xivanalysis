import CoreEnemies from 'parser/core/modules/Enemies'

const EASTERLY_NAME = 'Easterly'

export default class Enemies extends CoreEnemies {
	isValidEnemy(enemy) {
		if (!super.isValidEnemy(enemy)) {
			return false
		}

		// Easterlies aren't valid targets
		return !(enemy.name === EASTERLY_NAME)
	}
}
