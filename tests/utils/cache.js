
import cache from '../../server/utils/cache'

export default function () {
    describe('\n=== cache.readonly ===', () => {
        const caches = cache.readonly()

        test('缓存赋值', async () => {
            caches('k1', async () => {
                return 'k1666'
            })

            expect(await caches('k1')).toBe('k1666')
            expect(await caches('k1')).toBe('k1666')
        })

        test('缓存只读', async () => {
            caches('k1', async () => {
                return 'k1777'
            })

            expect(await caches('k1')).toBe('k1666')
        })

        test('缓存异步读取', async () => {
            const asyncValue = await caches('asyncValue', async () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('asyncValue1')
                    }, 200)
                })
            })

            expect(asyncValue).toBe('asyncValue1')
        })
    })

    describe('\n=== cache.normal ===', () => {
        const caches = cache.normal()

        test('缓存赋值', async () => {
            const version = 1

            const value1 = await caches('key', {
                value: async () => 'hello cubo',
                version: async () => version,
            })

            expect(value1).toBe('hello cubo')

            const value2 = await caches('key', {
                value: async () => 'hello cubo2',
                version: async () => version,
            })

            expect(value2).toBe('hello cubo')
        })

        test('缓存条件变更', async () => {
            let version = 2
            const value = 'A'
            const value1 = await caches('key', {
                value: async () => value,
                version: async () => version,
            })

            expect(value1).toBe('A')

            const value2 = await caches('key', {
                value: async () => 'B',
                version: async () => version,
            })

            expect(value2).toBe('A')

            version = 3
            expect(await caches('key')).toBe('B')
        })

        test('缓存异步读取', async () => {
            const asyncValue = await caches('asyncValue', async () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve('asyncValue1')
                    }, 200)
                })
            }, () => true)

            expect(asyncValue).toBe('asyncValue1')
        })
    })

    describe('\n=== cache.pool ===', () => {
        const caches = cache.pool()

        test('缓存赋值', async () => {
            const value1 = await caches('key', '#1', () => '##1')
            const value2 = await caches('key', '#2', () => '##2')

            expect(value1).toBe('##1')
            expect(value2).toBe('##2')

            expect(await caches('key', '#1')).toBe('##1')
            expect(await caches('key', '#2')).toBe('##2')
        })
    })
}
