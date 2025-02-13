export function iconUrl(icon: number): string {
	const group = Math.floor(icon / 1000) * 1000
	const gamePath = `ui/icon/${group.toString(10).padStart(6, '0')}/${icon.toString(10).padStart(6, '0')}_hr1.tex`
	// Yeah, 7.0 is a bit anachronistic, but we dropped 6.58x2 support to save storage space pending better HIST support, so 7.0'll do.
	return `https://v2.xivapi.com/api/asset?path=${gamePath}&format=png&version=7.0`
}
