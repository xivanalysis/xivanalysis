export function iconUrl(icon: number): string {
	const group = Math.floor(icon / 1000) * 1000
	return `https://xivapi.com/i/${group.toString(10).padStart(6, '0')}/${icon.toString(10).padStart(6, '0')}.png`
}
