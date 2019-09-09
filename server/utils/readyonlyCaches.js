
const DEFAULT = {
    maxAge: 1000 * 60 * 60,
    version: () => true,
    poolSize: 10,
}

const STATES = {
    init: 0,
    loading: 1,
    ready: 2,
}

class Cache {
    constructor (option) {
        this.valueGetter = option.valueGetter
        this.versionGetter = option.versionGetter
        this.maxAge = option.maxAge
        this.state = STATES.init
        this.expires = 0
        this.value = null
        this.version = null
        this.waits = []
    }

    async value () {
        if (this.state === STATES.ready) {
            if (this.expires > Date.now() || this.version !== await this.getVersion()) {
                this.state = STATES.init
            } else {
                return this.getValue()
            }
        }

        if (this.state === STATES.loading) {
            return this.asyncValue()
        }

        if (this.state === STATES.init) {
            const value = await this.valueGetter({ value: this.value, version: this.version })
            const version = await this.versionGetter({ value: this.value, version: this.version, newValue: value })

            this.state = STATES.ready
            this.version = version
            this.value = value

            this.resolveAsyncValues(value)
            return this.getValue()
        }
    }

    getValue () {
        this.expires = Date.now() + this.maxAge
        return this.value
    }

    setValue (value) {
        this.value = value
    }

    getExpires () {
        return this.state === STATES.ready ? this.expires : Infinity
    }

    isExpired () {
        return this.expires <= Date.now() && this.state === STATES.ready
    }

    isReady () {
        return this.state = STATES.ready
    }

    async asyncValue () {
        return new Promise((resolve) => {
            this.waits.push(resolve)
        })
    }

    resolveAsyncValues (value) {
        setTimeout(() => { // 延迟是为了让后面加入的后执行
            const { waits } = this
            while (waits.length > 0) {
                waits.shift()(value)
            }
        })
    }
}

class ReadonlyCaches {
    constructor (option) {
        this.caches = {}
        this.maxAge = option.maxAge || DEFAULT.maxAge
        this.version = option.version || DEFAULT.version
    }

    async bind (key, option) {
        if (Array.isArray(key)) {
            key = key.join('/')
        }

        if (typeof option === 'function') {
            option = {
                value: option,
            }
        }

        const valueGetter = option.value
        const versionGetter = option.version || this.version

        let cache = this.caches[key]
        if (!cache) {
            cache = this.caches[key] = new Cache({ valueGetter, versionGetter, maxAge: this.maxAge })
        }

        return cache.value()
    }
}

class GroupReadyonlyCaches {
    constructor (option) {
        this.groups = {}
        this.poolSize = option.poolSize || DEFAULT.poolSize
        this.maxAge = option.maxAge || DEFAULT.maxAge
        this.version = option.version || DEFAULT.version
    }

    async bind (key, option) {
        if (Array.isArray(key)) {
            key = key.join('/')
        }

        const code = option.code || 'DEFAULT'
        const valueGetter = option.value
        const versionGetter = option.version || this.version

        let group = this.groups[key]
        if (!group) {
            group = this.groups[key] = {
                caches: {},
                timer: null,
            }
        }
        const { caches } = group
        let cache = caches[code]
        if (!cache) {
            if (Object.keys(caches).length === this.poolSize) { // 已经达到上限了，则先释放旧的
                this.cleanCaches(group)
            }
            cache = caches[code] = new Cache({ valueGetter, versionGetter, maxAge: this.maxAge })
        }

        return cache.value()
    }

    async cleanCaches (group, isSync) {
        if (group.timer) {
            return
        }

        group.timer = setTimeout(() => {
            const { caches } = group
            const codes = Object.keys(caches)
            const expireds = []
            const readys = []
            codes.forEach((code) => {
                const cache = caches[code]
                if (cache.isExpired()) {
                    expireds.push(code)
                } else if (cache.isReady()) {
                    readys.push(code)
                }
            })

            const removeLength = Math.max(0, codes.length - this.poolSize) // 待移除的数量
            const removes = readys.sort((a, b) => caches[a].getExpires() - caches[b].getExpires()).slice(0, removeLength)

            expireds.concat(removes).forEach(code => delete caches[code])

            group.timer = null
        }, 1000)
    }
}

class GroupReadyonlyCache {
    constructor (option) {
        this.groups = {}
        this.poolSize = option.poolSize
        this.maxAge = option.maxAge || DEFAULT.maxAge
        this.version = option.version || DEFAULT.version
        this.cleanTimer = null // 垃圾回收器
    }

    async bind (key, option) {
        if (Array.isArray(key)) {
            key = key.join('/')
        }

        const code = option.code || 'DEFAULT'
        const valueGetter = option.value
        const versionGetter = option.version || this.version

        let group = this.groups[key]
        if (!group) {
            group = this.groups[key] = {
                caches: {},
                timer: null,
            }
        }
        const { caches } = group
        let cache = caches[code]
        if (!cache) {
            if (Object.keys(caches).length === this.poolSize) { // 已经达到上限了，则先释放旧的
                await this.cleanCaches(group, true)
            }
            cache = caches[code] = new Cache({ valueGetter, versionGetter, maxAge: this.maxAge })
        }

        return cache.value()
    }

    async cleanCaches (group, isSync) {
        if (group.timer) {
            return
        }

        group.timer = setTimeout(() => {
            const { caches } = group
            const keys = Object.keys(caches)
            const expireds = []
            const readys = []
            keys.forEach((key) => {
                const cache = caches[key]
                if (cache.isExpired()) {
                    expireds.push(key)
                } else if (cache.isReady()) {
                    readys.push(cache)
                }
            })
        }, 1000)
    }

    async cleanGroupCaches (group) {
        const { caches } = group
        const keys = Object.keys(caches)

        // 尝试移除过期的项
        const removes = keys.filter(key => caches[key].isExpired())
        if (removes.length > 0) {
            removes.forEach(key => delete caches[key])
            return
        }

        // 尝试移除最短有效期的项
        let minExpires = Infinity
        let removedKey = null
        keys.forEach(key => {
            const cache = caches[key]
            if (cache.isReady()) {
                const expires = cache.getExpires()
                if (expires < minExpires) {
                    minExpires = expires
                    removedKey = key
                }
            }
        })
        if (removedKey) {
            delete caches[removedKey]
            return
        }

        // 某项就绪，则马上移除
        let isRemoved = false
        keys.forEach(key => {
            caches[key].onReady(() => {
                if (isRemoved) {
                    return
                }
                isRemoved = true
                delete caches[key]
            })
        })
    }
}

function cacheProxy (option = {}) {
    const newOption = {
        maxAge: option.maxAge || DEFAULT.maxAge,
        poolSize: option.poolSize || DEFAULT.poolSize,
    }

    const caches = newOption.poolSize > 1 ? new ReadonlyCaches(newOption) : new GroupReadyonlyCaches(newOption)

    return async () => caches.bind(...arguments)
}

export default cacheProxy

const caches = cacheProxy({ poolSize: 0 })

caches('key', () => {

})
