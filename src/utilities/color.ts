import Color from 'color'

const colorCache = new Map<string, Color>()
export function seededColor(key: string) {
	let color = colorCache.get(key)

	if (color == null) {
		let seed = 0
		for (let index = 0; index < key.length; index++) {
			seed += key.charCodeAt(index)
		}
		// tslint:disable-next-line:no-magic-numbers
		color = Color.hsl(seed % 255, 255, 65)
		colorCache.set(key, color)
	}

	return color
}
