/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  //插件
  Vue.use = function (plugin: Function | Object) {
    // this谁调用就指向谁
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 把arguments参数转换成数组，把数组中的第一个元素（plugin）去除 
    const args = toArray(arguments, 1)
    // 把this（Vue）插入第一个元素的位置
    args.unshift(this)
    // 判断plugin是否是对象 如果是对象必须有一个install方法
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    // 保存我们已经安装的插件
    installedPlugins.push(plugin)
    return this
  }
}