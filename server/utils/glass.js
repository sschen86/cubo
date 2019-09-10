
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
            const caches = cache()
            return Class.__proxy__ = async function () {
                const proxyId = [...arguments]
                return caches(proxyId, {
                    async value ({ value }) {
                        if (!value) {
                            return (new Class(...proxyId)).init()
                        }
                        return value.update ? value.update() : value.init()
                    },
                    async version () {
                        return this.version ? this.version() : this.lastModified
                    },
                })
            }
        },
    }
}

export default glass
