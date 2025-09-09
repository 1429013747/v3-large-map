import { reactive } from 'vue'

/**
 * 全局Loading状态管理
 * 支持多个并发loading操作，每个操作有独立的key
 */

// 全局loading状态
const globalLoadingState = reactive({
  // 当前正在进行的loading操作
  loadingOperations: new Map(),
  // 是否有任何loading操作在进行
  isLoading: false,
  // 当前显示的loading消息
  message: '',
  // loading的类型（可用于不同样式,未开发）
  type: 'default' // 'default' | 'overlay' | 'inline'
})

// loading计数器，用于生成唯一key
let loadingCounter = 0

/**
 * 全局Loading Composable
 */
export function useGlobalLoading() {
  /**
   * 开始loading操作
   * @param {string} message - loading显示的消息
   * @param {string} type - loading类型
   * @param {string} key - 操作的唯一标识，不传则自动生成
   * @returns {string} 返回操作的key，用于后续停止loading
   */
  function startLoading(message = '加载中...', type = 'default', key = null) {
    const operationKey = key || `loading_${++loadingCounter}_${Date.now()}`

    globalLoadingState.loadingOperations.set(operationKey, {
      message,
      type,
      startTime: Date.now()
    })

    // 更新全局状态
    updateGlobalState()

    console.log(`🔄 开始Loading操作: ${operationKey} - ${message}`)

    return operationKey
  }

  /**
   * 停止指定的loading操作
   * @param {string} key - 要停止的操作key
   */
  function stopLoading(key) {
    if (globalLoadingState.loadingOperations.has(key)) {
      const operation = globalLoadingState.loadingOperations.get(key)
      const duration = Date.now() - operation.startTime

      globalLoadingState.loadingOperations.delete(key)
      updateGlobalState()

      console.log(`✅ Loading操作完成: ${key} - 耗时 ${duration}ms`)
    }
  }

  /**
   * 停止所有loading操作
   */
  function stopAllLoading() {
    const count = globalLoadingState.loadingOperations.size
    globalLoadingState.loadingOperations.clear()
    updateGlobalState()

    if (count > 0) {
      console.log(`🛑 已停止所有Loading操作 (${count}个)`)
    }
  }

  /**
   * 更新全局loading状态
   */
  function updateGlobalState() {
    const operations = Array.from(globalLoadingState.loadingOperations.values())

    globalLoadingState.isLoading = operations.length > 0

    if (operations.length > 0) {
      // 优先显示最新的loading消息
      const latestOperation = operations[operations.length - 1]
      globalLoadingState.message = latestOperation.message
      globalLoadingState.type = latestOperation.type
    }
    else {
      globalLoadingState.message = ''
      globalLoadingState.type = 'default'
    }
  }

  /**
   * 检查指定操作是否正在loading
   * @param {string} key - 操作key
   * @returns {boolean} 是否正在loading
   */
  function isOperationLoading(key) {
    return globalLoadingState.loadingOperations.has(key)
  }

  /**
   * 获取当前所有loading操作
   * @returns {Array} 当前操作列表
   */
  function getCurrentOperations() {
    return Array.from(globalLoadingState.loadingOperations.entries()).map(([key, operation]) => ({
      key,
      ...operation
    }))
  }

  /**
   * 模拟异步操作的包装器
   * @param {Function} asyncFunction - 要执行的异步函数
   * @param {string} message - loading消息
   * @param {string} type - loading类型
   * @param {string} key - 操作key
   * @returns {Promise} 异步函数的返回值
   */
  async function withLoading(asyncFunction, message = '处理中...', type = 'default', key = null) {
    const operationKey = startLoading(message, type, key)

    try {
      const result = await asyncFunction()
      return result
    }
    catch (error) {
      console.error(`❌ Loading操作出错: ${operationKey}`, error)
      throw error
    }
    finally {
      stopLoading(operationKey)
    }
  }

  return {
    // 状态
    globalLoadingState,

    // 方法
    startLoading,
    stopLoading,
    stopAllLoading,
    isOperationLoading,
    getCurrentOperations,
    withLoading
  }
}

// 创建全局实例，确保整个应用共享同一个loading状态
export const globalLoading = useGlobalLoading()
