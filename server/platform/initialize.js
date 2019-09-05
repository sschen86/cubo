import fs from 'fs'
import { paths } from './define'

const { workspace, trunk, work, stage, branch, user, userConfig } = paths

if (!fs.existsSync(workspace)) {
    console.error(`工作目录“${workspace}”不存在，请在config中配置WORK_DIR`)
    process.exit()
}

if (!fs.existsSync(trunk)) { // 主干目录不存在，初始化
    [trunk, work, stage, branch, user, userConfig].forEach(dir => fs.mkdirSync(dir))
    fs.writeFileSync(userConfig, '{}', 'utf-8')
}
