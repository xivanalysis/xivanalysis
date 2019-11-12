import {danger, message} from 'danger'

const Labels = {
	Parser: {
		CORE: {name: 'Parser - Core', description: '', color: '#aaaaaa'},
	},
}

const modifiedMD = danger.git.modified_files.join('\n- ')
message('Changed Files in this PR: \n- ' + modifiedMD)

// Label test
danger.github.utils.createOrAddLabel(Labels.Parser.CORE)
