
import cache from '../../server/utils/cache'

export default function () {
    describe('\n=== cache ===', () => {
        test('纯静态缓存读取', async () => {
            const caches = cache()
            const getValue = async () => caches('key', () => Math.random())

            expect(await getValue()).toBe(await getValue())
            expect(await getValue()).toBe(await getValue())
        })

        test('缓存时间过期失效', async () => {
            const caches = cache({ maxAge: 100 })
            const getValue = async () => caches('key', () => Math.random())
            const oldValue = await getValue()
            expect(await getValue()).toBe(oldValue)

            setTimeout(async () => {
                expect(await getValue()).toBe(oldValue)
            }, 10)

            setTimeout(async () => {
                expect(await getValue()).toBe(oldValue)
            }, 10 + 92)

            setTimeout(async () => {
                expect(await getValue()).not.toBe(oldValue)
            }, 10 + 92 + 120)
        })

        test('缓存版本过期失效', async () => {
            const caches = cache()
            const getValue = async () => caches('key', {
                value: () => Math.random(),
                version: () => version,
            })

            let version = 0
            const oldValue = await getValue()

            expect(await getValue()).toBe(oldValue)
            expect(await getValue()).toBe(oldValue)

            version = 1
            const newValue = await getValue()
            expect(newValue).not.toBe(oldValue)
            expect(await getValue()).toBe(newValue)
        })

        test('缓存异步读取', async () => {
            const caches = cache()
            let value = 1
            const getValue = async () => caches('key', async () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(value)
                    }, 1000)
                })
            })
            const value1 = await getValue()
            value = 2
            const value2 = await getValue()

            expect(value1).toBe(1)
            expect(value2).toBe(1)
        })

        test('缓存池使用', async () => {
            const caches = cache({ poolSize: true })
            const [code1, code2, code3] = ['?name=张三', '?name=李四', '?name=王五']
            const getValue = async (code) => caches('key', {
                code,
                async value () {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(code)
                        }, 100)
                    })
                },
            })

            const value1 = await getValue(code1)
            const value2 = await getValue(code2)
            const value3 = await getValue(code3)

            expect(value1).not.toBe(value2)
            expect(await getValue(code1)).toBe(value1)
            expect(await getValue(code2)).toBe(value2)
            expect(await getValue(code3)).toBe(value3)
        })

        test('缓存池清理', async () => {
            const caches = cache({ poolSize: 2 })
            const [code1, code2, code3] = ['张三', '李四', '王五']

            const getValue = async (code) => caches('key', {
                code,
                value: async () => code + Math.random(),
            })

            const value1 = await getValue(code1)
            const value2 = await getValue(code2)
            const value3 = await getValue(code3)

            expect(await getValue(code3)).toBe(value3)
            expect(await getValue(code2)).toBe(value2)
            expect(await getValue(code1)).not.toBe(value1) // value1原值已被回收，新的值是后续生成的

            setTimeout(async () => {
                expect(await getValue(code2)).toBe(value2)
                expect(await getValue(code3)).not.toBe(value3) // value3在读取code2的时候被回收了
            }, 2000)
        })
    })
}
