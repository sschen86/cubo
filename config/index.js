const config = {
    DEBUG: 1, // 调试等级，0（不开启），1（常规调试）
    PORT: 80, // 服务器端口
    MYSQL: {
        host: 'localhost',
        user: 'css',
        password: '123456',
        database: '571xzV7',
        port: 3306,
        connectionLimit: 100,
    },
    SUPER_PASSWORD: 'e10adc3949ba59abbe56e057f20f883e',
    WORKSPACE: 'c:/workspace/cubo/v1/', // 工作目录
    BASE_TEMPLATE_PATH: '/v1/', // 模板的默认起始路径
    BASE_STYLE_PATH: '//style.571xz.com/v1/', // 样式的默认起始路径

}

export default config
