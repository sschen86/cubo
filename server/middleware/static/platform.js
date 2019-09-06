import send from 'koa-send'

export default async function (ctx) {
    const path = ctx.path
    const platformUrlRe = RegExp('\\/@cubo@\\/')
    const platformUrlConfig = {
        root: process.cwd() + '/client/website',
        index: 'index.html',
        maxage: 60000 * 24 * 365,
    }

    if (platformUrlRe.test(path)) {
        await send(ctx, path.replace(platformUrlRe, '/'), platformUrlConfig).catch(err => {
            if (err.code === 'ENOENT' && err.status === 404) {
                ctx.status = 404
                ctx.body = 'File Not Found'
            }
        })
        return true
    }
}
