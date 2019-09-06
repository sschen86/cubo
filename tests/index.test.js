
import cache from './utils/cache'

const tests = {
    cache,

}

const test = tests.nil

if (test) {
    test()
} else {
    for (const key in tests) {
        tests[key]()
    }
}
