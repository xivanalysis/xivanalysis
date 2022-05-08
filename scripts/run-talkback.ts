/* eslint-disable no-console */
import talkback from 'talkback/es6'

const opts = {
	host: 'https://xivanalysis.com/proxy/fflogs',
	record: talkback.Options.RecordMode.NEW,
	port: 5544,
	path: './tapes',
}

const server = talkback(opts)
server.start(() => console.log('Talkback Started'))
