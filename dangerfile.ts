import {danger, message} from 'danger'

const modifiedMD = danger.git.modified_files.join('\n- ')
message('Changed Files in this PR: \n- ' + modifiedMD)
