# Vue.js 源码剖析-响应式原理、虚拟 DOM、模板编译和组件化

## 1、请简述 Vue 首次渲染的过程。

- Vue初始化
  - 实例成员，静态成员
- new Vue
  - this.init() vue的入口
    - 调用src/platforms/web/entry-runtime-with-compiler.js中的vm.$mount()
      - 帮我们把模板编译成render函数，首先会判断是否有传入render选项，如果没有传递render，会先获取template，如果template也没有会把el中的内容作为我们的模板，然后通过compileToFunctions生成render()渲染函数，编译完成后将render存储到options.render中
    - 调用src/platforms/web/runtime/index.js中的vm.$mount()
      - 这个方法中重新获取el
      - 如果是运行时版本会在mountComponent()重新获取el
    - mountComponent
      - 首先判断是否有render选项，如果没有但是传入了template，并且是开发环境的话会发送警告，告诉我们运行时版本不支持编译器
      - 触发beforeMount，开始挂载之前
      - 定义updateComponent，这个函数中调用了`vm._render()`渲染虚拟DOM，`vm._update`更新，将虚拟DOM转换成真实DOM并挂载到页面
      - 创建Watcher实例
        - updateComponent内部传递
        - 调用get方法
      - 触发mounted
      - return vm
    - watcher.get()
      - 创建完watcher会调用一次get
      - 调用updateComponent()
      - 调用`vm._render()`创建vNode
        - 调用render.call
        - 调用实例化时Vue传入的render()
        - 或者编译成template生成的render()
        - render()执行完毕返回VNode（虚拟DOM）
      - 调用`vm._update()`
        - 调用`vm__patch__`将虚拟dom转换成真实dom挂载到界面上
        - 将生成的真实DOM记录vm.$el

## 2、请简述 Vue 响应式原理。

- init
  - initState()初始化Vue实例的状态
  - initData()把data属性注入到Vue实例上
  - observe()把data对象转换成响应式对象
- observe
  - 判断传入的value是否是对象，如果不是直接返回
  - 判断value这个对象是否有`__ob__`属性，如果有的话直接返回，如果没有，创建observer对象，然后返回这个对象
- Observer
  - 给value对象定义不可枚举的`__ob__`属性，记录到当前的observer对象中
  - 如果当前value是数组，进行数组的响应化处理，设置数组的几个特殊方法，push，pop，shift等等，这些方法会改变原数组，这些方法被调用的时候会发送通知，发送通知的时候找到数组对象对应的`__ob__`也就是Observer对象，在找到这个Observer中的dep，调用dep的notify方法，更改完成这些数组的特殊方法之后，接下来是遍历数组的每一个成员，对每一个成员再去调用observer，如果这个成员是对象的话，也会把这个对象转成成响应式的对象
  - 如果当前value是对象，会调用walk方法，walk方法会遍历这个对象的所有属性，每一个属性都会调用defineReactive()
- defineReactive
  - 为每一个属性创建对应的dep对象，让dep去收集依赖
  - 如果当前的属性是对象，会调用observer，转换成响应式的对象，defineReactive最核心的事情就是getter/setter方法
  - getter去收集依赖的时候会为每一个属性收集依赖，如果这个属性的值是对象，它也要为这个子对象收集依赖，最终返回这个属性的值
  - setter先将新值保存下来，如果新值是对象会调用observer，转换成响应式对象，setter里面数据发送了变化会发送通知，调用dep.notify()
- 依赖收集
  - 首先会执行wacher对象的get方法，在get方法中调用pushTarget记录Dep.target属性，在访问data属性的成员时会触发defineReactived的getter去收集依赖，会把属性对应的wacher对象添加到dep的subs数组中，如果这个属性的值也是对象会创建一个childOb对象为这个子对象收集依赖，目的是将来这个子对象发送变化的时候可以发送通知
- Wacher
  - 当数据发生变化的时候调用dep.notify()发送通知，dep.notify()在调用wacher对象的update()方法
  - 在wacher对象的update()方法会调用queueWacher()会判断wacher是否被处理了，如果没有的话添加到queue队列中，并调用flushSchedulerQueue()刷新队列的函数
  - flushSchedulerQueue
    - 触发beforeUpdate钩子函数
    - 调用wacher.run()方法，run()=>get()=>getter()=>updateComponent
    - 清空上一次的依赖，重置wacher的一些状态
    - 触发actived钩子函数
    - 触发updated钩子函数

## 3、请简述虚拟 DOM 中 Key 的作用和好处。

答：在v-for的过程中，可以给每一个节点设置key属性，以便它能够跟踪每个节点的身份，从而重用和重新排序现有元素，设置key比不设置key的DOM操作要少很多。

## 4、请简述 Vue 中模板编译的过程。

- compileToFunctions()内部先从缓存中加载编译好的render函数，如果缓存中没有调用complie()开始编译，在complie函数中首先去合并选项，然后调用baseCompile()去编译模板。
- compile()的核心是合并选项，真正处理是在baseCompile函数中完成，把模板和合并好的选项传递给baseCompile()。
- baseCompile()完成了模板编译核心的三件事情
  - parse()把template转换成AST Tree（抽象语法树）
  - optimize()对AST Tree进行优化，标记AST Tree中的 sub Tree,检测到静态子树（静态根节点），设置成静态，不需要在每次重新渲染的时候重新生成节点，patch()阶段会跳过静态根节点。
  - generate()将优化后的AST Tree对象转换成字符串形式的代码
- compileToFunctions
  - 继续把代码转换成函数的形式
  - 通过调用createFunction
  - 当render和staticRenderFns创建完毕，都会被挂载到Vue实例的options对应的属性上
