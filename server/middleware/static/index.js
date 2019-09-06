import platform from './platform'
import devStyle from './devStyle'
import staticFile from './staticFile'
import openStyle from './openStyle'

export default async function (ctx, next) {
    await platform(ctx) || await devStyle(ctx) || await staticFile(ctx) || await openStyle(ctx) || next()
}
