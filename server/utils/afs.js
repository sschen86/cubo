import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'

export const stat = promisify(fs.stat)
export const readFile = promisify(fs.readFile)
export const writeFile = promisify(fs.writeFile)
export const readdir = promisify(fs.readdir)
export const rename = promisify(fs.rename)
export const moveFile = rename
export const copyFile = promisify(fs.copyFile)

export const rmvFile = promisify(fs.unlink)
export const dirpath = (filepath) => path.parse(filepath) + '/'
export const isfile = async (path) => {
    try {
        return (await stat(path)).isFile()
    } catch (e) {
        return false
    }
}
export const isdir = async (path) => {
    try {
        return (await stat(path)).isDirectory()
    } catch (e) {
        return false
    }
}

export const opendir = (path) => {
    spawn('explorer.exe', [path.replace(/\//g, '\\')])
}

export const mkdir = promisify(fs.mkdir)
export const deepMkdir = async (dirpath) => { // 支持递归创建目录
    dirpath = dirpath.replace(/\//g, '\\') + 'default'
    const sep = path.sep
    const folders = path.dirname(dirpath).split(sep)

    let nowPath = ''
    for (let i = 0; i < folders.length; i++) {
        nowPath = folders[i] + sep
        try {
            if (!await isdir(nowPath)) { // 异步模型就是坑，有时导致isdir的判断失效
                await mkdir(nowPath)
            }
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err
            }
        }
    }
}

export const version = async (path) => {
    if (!await isfile(path)) {
        return null
    }

    const fileStat = await stat(path)
    return [Number(fileStat.mtime), fileStat.size].join('-')
}

export const files = async (root, callback, deep) => {
    if (!await isdir(root)) {
        return
    }

    root = root.replace(/\\/g, '/')

    const dirs = await readdir(root)
    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i]
        const path = (root + '/' + dir).replace(/[\\/]+/g, '/')
        if (await isfile(path)) {
            if (await callback(path, dir) === false) {
                break
            }
        } else if (deep && await isdir(path)) {
            await files(path + '/', callback, deep)
        }
    }
}

export const compare = async (path1, path2) => { // 判断2个文件是否相等，0相对，1不相等，-1文件2不存在
    const stat1 = await isfile(path1) ? await stat(path1) : false
    const stat2 = await isfile(path2) ? await stat(path2) : false
    if (stat1 === false) {
        throw Error('fs.compare(path1, path2), 文件路径无效"' + path1 + '"')
    }
    if (stat2 === false) {
        return -1
    }
    if (stat1.size === stat2.size && +stat1.mtime === +stat2.mtime) {
        return 0
    }
    if (await readFile(path1, 'hex') === await readFile(path2, 'hex')) {
        return 0
    }
    return 1
}

export const dirIsEmpty = async (path) => (await readdir(path)).length === 0
export const rmdir = promisify(fs.rmdir)
export const deepRmdir = async (dir) => {
    if (await isfile(dir)) {
        await rmvFile(dir)
    } else {
        const dirs = await readdir(dir)
        for (let i = 0; i < dirs.length; i++) {
            await deepRmdir(dir + '/' + dirs[i])
        }
        await rmdir(dir)
    }
}
