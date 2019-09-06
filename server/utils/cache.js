
const STATES = {
    INIT: 0, // 未就绪
    LOADING: 1, // 生成中
    READY: 2, // 已就绪
}
const POOL_MAXNUM = 10

function normal () {
    const caches = {}

    return async function (key, valueGetter, versionGetter) {
        if (Array.isArray(key)) {
            key = key.join('/')
        }

        if (typeof valueGetter === 'object') {
            versionGetter = valueGetter.version
            valueGetter = valueGetter.value
        }

        const cache = caches[key] = caches[key] || {
            state: STATES.INIT,
            value: null,
            version: null,
            waits: [],
            exists: false,
            getters: {
                value: valueGetter,
                version: versionGetter,
            },
        }

        if (valueGetter) { // 更新缓存条件
            cache.getters.value = valueGetter
            cache.getters.version = versionGetter
        } else {
            valueGetter = cache.getters.value
            versionGetter = cache.getters.version
        }

        if (cache.state === STATES.READY) {
            if (await versionGetter({ value: cache.value, version: cache.version }) === cache.version) { // 缓存未过期
                return cache.value
            }

            // 缓存过期了
            cache.state = STATES.INIT
        }

        if (cache.state === STATES.LOADING) {
            return (async () => new Promise(resolve => cache.waits.push(resolve)))()
        }

        if (cache.state === STATES.INIT) {
            cache.state = STATES.INIT
            const value = cache.value = await valueGetter()
            cache.version = await versionGetter({ value, version: cache.version })
            cache.state = STATES.READY

            const { waits } = cache
            while (waits.length) {
                waits.shift()(value)
            }

            return value
        }
    }
}

function readonly () {
    const caches = {}

    return async function (key, getter) {
        if (Array.isArray(key)) {
            key = key.join('/')
        }

        const cache = caches[key] = caches[key] || {
            state: STATES.INIT,
            value: null,
            waits: [],
            async asyncValue () {
                return new Promise(resolve => {
                    cache.waits.push(resolve)
                })
            },
        }

        if (cache.state === STATES.READY) {
            return cache.value
        }

        if (cache.state === STATES.LOADING) {
            return cache.asyncValue()
        }

        if (cache.state === STATES.INIT) {
            cache.state = STATES.LOADING
            const value = cache.value = await getter()
            cache.state = STATES.READY

            const { waits } = cache
            while (waits.length) {
                waits.shift()(value) // 消除队列
            }

            return value
        }
    }
}

function pool (option = {}) {
    const caches = {}
    const maxNum = option.maxNum || POOL_MAXNUM
    return async function (key, params, option = {}) {
        if (Array.isArray(key)) {
            key = key.join('/')
        }

        if (typeof option === 'function') {
            option = {
                version: () => true,
                value: option,
            }
        }

        const poolId = '#' + params
        const pool = caches[key] = caches[key] || {
            pendingNum: 0, // 缓存池中进行中的任务数量
            freeNum: maxNum, // 缓存池空闲数量
            waits: [], // 缓存池等待队列
            getters: {
                value: option.value,
                version: option.version,
            },
        }

        const cache = pool[poolId] = pool[poolId] || {
            state: STATES.INIT,
            value: null,
            version: null,
            timestamp: 0,
            waits: [],
        }

        let valueGetter, versionGetter
        if (option.value) {
            valueGetter = pool.getters.value = option.value
            versionGetter = pool.getters.version = option.version
        } else {
            valueGetter = pool.getters.value
            versionGetter = pool.getters.version
        }

        if (cache.state === STATES.READY) {
            if (await versionGetter({ value: cache.value, version: cache.version }) === cache.version) {
                cache.timestamp = +new Date() // 更新缓存新鲜度，新鲜度低的会被优先回收
                return cache.value
            } else { // 缓存已过期
                cache.state = STATES.INIT
            }
        }

        if (cache.state === STATES.LOADING) { // 缓存生成中
            pool.pendingNum++
            return (async function () {
                return new Promise(function (resolve) {
                    cache.waits.push(resolve)
                })
            })()
        }

        if (cache.state === STATES.INIT) {
            cache.state = STATES.LOADING

            if (pool.freeNum === 0) { // 缓存池不够，进入等待状态
                if (pool.pendingNum === pool.maxNum) { // 假如所有的缓存池处于等待状态，则新的任务加入到缓存池队列中
                    await (async function () {
                        return new Promise(resolve => {
                            pool.waits.push(resolve)
                        })
                    })()
                } else {
                    freePool()
                }
            }

            pool.freeNum--

            const value = await valueGetter()
            const version = await versionGetter({ value, version: cache.version })

            cache.state = STATES.READY
            cache.value = value
            cache.timestamp = +new Date()
            cache.version = version

            pool.pendingNum--

            while (cache.waits.length) {
                cache.waits.shift()(value) // 消除队列
            }

            if (pool.waits.length) { // 存在等待的队列
                freePool()
                pool.waits.shift()()
            }

            return value
        }

        function freePool () {
            let timestamp = +new Date()
            let beFreePoolId

            for (const poolId in pool) { // 遍历缓存池，移除最旧的缓存
                if (poolId.charAt(0) !== '#') {
                    continue
                }

                const cache = pool[poolId]

                if (timestamp > cache.timestamp) { // 取时间戳最小的缓存移除
                    timestamp = cache.timestamp
                    beFreePoolId = poolId
                }
            }

            delete pool[beFreePoolId]
            pool.freeNum++
        }
    }
}

export default {
    normal,
    readonly,
    pool,
}
