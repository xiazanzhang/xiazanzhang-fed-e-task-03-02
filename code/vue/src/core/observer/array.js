/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
// 使用数组的原型创建一个对象
export const arrayMethods = Object.create(arrayProto)

// 修改数组元素的方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // 保存原数组方法
  // cache original method
  const original = arrayProto[method]
  // 调用Object.defineProperty() 重新定义修改数组的方法
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    // 获取数组对象的ob对象
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 对插入的新元素，遍历数组元素转换成响应式对象
    if (inserted) ob.observeArray(inserted)
    // 调用了修改数组的方法，调用数组的ob对象发送通知
    // notify change
    ob.dep.notify()
    return result
  })
})
