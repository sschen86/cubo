import config from '../../config'

const { WORKSPACE } = config

const workspace = WORKSPACE
const trunk = workspace + 'trunk/'
const trunkWork = trunk + 'work/'
const trunkStage = trunk + 'stage/'
const branch = workspace + 'branch/'
const mappingsInfo = workspace + 'mappings.json'
const user = workspace + 'user/'
const userInfo = user + 'admin.json'

export const paths = {
    workspace,
    trunk,
    trunkWork,
    trunkStage,
    branch,
    mappingsInfo,
    user,
    userInfo,
}
