
import cache from './cache'

function glass (Class) {
    return {

        // 定义接口
        interface (prototype) {
            Object.assign(Class.prototype, prototype)
        },

        // 多重继承接口
        extends (...Classes) {
            const prototype = {}
            Classes.forEach(Class => {
                Object.assign(prototype, Class.prototype)

                // 保持父级的引用，类似supper方法
                for (const key in Class.prototype) {
                    prototype[Class.name + '__' + key] = Class.prototype[key]
                }
                prototype[Class.name] = Class
            })

            Object.assign(prototype, Class.prototype)
            Object.assign(Class.prototype, prototype)
        },

        // 扩展静态方法和属性
        static (statics) {
            Object.assign(Class.__proxy__, statics)
        },

        proxy () {
            const caches = cache.normal()
        },
    }
}

export default glass

/*
module.exports = glass

const cache = require('./cache')

function glass(glass) {

    return {

        static(interface) {
            Object.assign(glass.__proxy__, interface)
        },

        versionProxy() {

            let versionCache = cache.versionCache()

            return glass.__proxy__ = async function () {

                let proxyId = [...arguments]

                return await versionCache(proxyId, {

                    async create() {
                        return await (new glass(...proxyId)).init()
                    },

                    async update() {
                        return this.update ? await this.update() : await this.init()
                    },

                    async version() {
                        return this.version ? await this.version() : this.lastModified
                    },

                })

            }

        },

    }

}

*/
