export default function (ctx, next) {
    if (ctx.path === '/favicon.ico') {
        return ctx.res.end()
    }
    next()
}
