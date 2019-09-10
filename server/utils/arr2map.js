export default (arr, key) => arr.reduce((map, item) => {
    map[item[key]] = item
    return map
}, {})
