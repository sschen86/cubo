process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason)
})

process.on('uncaughtException', function (err) {
    console.log('An uncaught error occurred!')
    console.log(err.stack)
})
