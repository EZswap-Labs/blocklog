/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-26 22:12:48
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-06-11 12:48:14
 */
export default {
  apps: [{
    name: "blocklog",
    script: "./app.js",
    env_production: {
      NODE_ENV: "prod"
    },
    env_development: {
      NODE_ENV: "local"
    },
    max_restarts: 1000000,
    cron_restart: '2 * * * *',
    time: true,
  }]
}
