/*
 * @Descripttion : 
 * @version      : 1.0.0
 * @Author       : 
 * @Date         : 2023-05-26 22:12:48
 * @LastEditors  : Please set LastEditors
 * @LastEditTime : 2023-05-31 20:04:52
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
    max_restarts: 100000
  }]
}
