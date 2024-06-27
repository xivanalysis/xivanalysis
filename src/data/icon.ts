export function iconUrl(icon: number): string {
	const group = Math.floor(icon / 1000) * 1000
	const gamePath = `ui/icon/${group.toString(10).padStart(6, '0')}/${icon.toString(10).padStart(6, '0')}_hr1.tex`
	return `https://beta.xivapi.com/api/1/asset/${gamePath}?format=png`
}
