
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

    async asyncValue () {
        // console.info(this)

        if (this.state === STATES.ready) {
            if (this.expires < Date.now() || this.version !== await this.versionGetter({ value: this.value, version: this.version })) {
                this.state = STATES.init
            } else {
                return this.getValue()
            }
        }

        if (this.state === STATES.loading) {
            return this.waitValue()
        }

        if (this.state === STATES.init) {
            const value = await this.valueGetter({ value: this.value, version: this.version })
            const version = await this.versionGetter({ value: this.value, version: this.version, newValue: value })

            this.state = STATES.ready
            this.version = version
            this.value = value

            this.resolveWaits(value)
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
        return STATES.ready
    }

    async waitValue () {
        return new Promise((resolve) => {
            this.waits.push(resolve)
        })
    }

    resolveWaits (value) {
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

        return cache.asyncValue()
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

        if (typeof option === 'function') {
            option = {
                value: option,
            }
        }

        const code = option.code || 'DEFAULT'
        const valueGetter = option.value
        const versionGetter = option.version || this.version

        let group = this.groups[key]
        if (!group) {
            group = this.groups[key] = {
                caches: {},
                cleaning: false,
            }
        }
        const { caches } = group
        let cache = caches[code]

        if (!cache) {
            cache = caches[code] = new Cache({ valueGetter, versionGetter, maxAge: this.maxAge })
        }

        if (Object.keys(caches).length > this.poolSize) { // 已经达到上限了，启动清理
            this.cleanCaches(group)
        }

        return cache.asyncValue()
    }

    cleanCaches (group) {
        if (group.cleaning) {
            return
        }

        group.cleaning = true
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
        const removes = readys.sort((a, b) => caches[a].getExpires() - caches[b].getExpires()).slice(0, removeLength) // 根据到期时间进行排序进行移除

        expireds.concat(removes).forEach(code => delete caches[code])

        setTimeout(() => {
            group.cleaning = false
            if (Object.keys(group.caches).length > this.poolSize) {
                this.cleanCaches(group)
            }
        }, 1000)
    }
}

function cacheProxy (option = {}) {
    const newOption = {
        maxAge: option.maxAge || DEFAULT.maxAge,
    }

    const poolSize = option.poolSize
    if (poolSize === true) {
        newOption.poolSize = DEFAULT.poolSize
    } else if (poolSize > 1) {
        newOption.poolSize = poolSize
    } else {
        newOption.poolSize = 1
    }

    const caches = newOption.poolSize > 1 ? new GroupReadyonlyCaches(newOption) : new ReadonlyCaches(newOption)
    return async function () {
        return caches.bind(...arguments)
    }
}

export default cacheProxy

// const caches = cache({ poolSize: 3, maxAge: 1000 })
// caches('cacheKey', {
// code: '',
// value: async() => true,
// version: async() => true
// })
