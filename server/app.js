
import config from '../config'
import Koa from 'koa'
import IPv4 from './utils/IPv4'
import faviconMiddleware from './middleware/favicon'
import sessionMiddleware from './middleware/session'
import staticMiddleware from './middleware/static'

const { PORT } = config

const app = new Koa()

app.use(faviconMiddleware)
app.use(sessionMiddleware)
app.use(staticMiddleware)

app.listen(PORT)

console.info(`listen on: http://${IPv4}${PORT === 80 ? '' : ':' + PORT}`)
