import fs from 'fs'
import { paths } from './define'

const { workspace, trunk, trunkWork, trunkStage, branch, user, userInfo, mappingsInfo } = paths

if (!fs.existsSync(workspace)) {
    console.error(`工作目录“${workspace}”不存在，请在config中设置WORKSPACE字段`)
    process.exit()
}

if (!fs.existsSync(trunk)) { // 主干目录不存在，初始化
    ;[trunk, trunkWork, trunkStage, branch, user].forEach(dir => fs.mkdirSync(dir))
    ;[userInfo, mappingsInfo].forEach((path) => fs.writeFileSync(path, '{}', 'utf-8'))
}
