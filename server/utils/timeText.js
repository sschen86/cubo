export default function (timestamp) { // => 20191212_081660
    const date = timestamp ? new Date(timestamp) : new Date()
    return [
        date.getFullYear(), '#',
        date.getMonth() + 1, '##',
        date.getDate(), '#_#',
        date.getHours(), '##',
        date.getMinutes(), '##',
        date.getSeconds(), '#',
    ].join('').replace(/#(\d\d?)#/g, (source, num) => num < 10 ? '0' + num : num)
}
