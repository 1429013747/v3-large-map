import request from '@/utils/request'

/**
 * 轨迹动画相关API
 * 提供轨迹数据的获取、创建、更新、删除等功能
 */

/**
 * 获取轨迹列表
 * @param {Object} params - 查询参数
 * @param {string} params.vesselId - 船舶ID
 * @param {string} params.startTime - 开始时间
 * @param {string} params.endTime - 结束时间
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页数量
 * @returns {Promise} API响应
 */
export const getTrackList = (params) => {
  return request({
    url: '/api/track/list',
    method: 'get',
    params
  })
}

/**
 * 获取轨迹详情
 * @param {string} trackId - 轨迹ID
 * @returns {Promise} API响应
 */
export const getTrackDetail = (trackId) => {
  return request({
    url: `/api/track/${trackId}`,
    method: 'get'
  })
}

/**
 * 创建轨迹
 * @param {Object} data - 轨迹数据
 * @param {string} data.vesselId - 船舶ID
 * @param {string} data.vesselName - 船舶名称
 * @param {Array} data.coordinates - 坐标点数组
 * @param {string} data.startTime - 开始时间
 * @param {string} data.endTime - 结束时间
 * @param {string} data.description - 描述
 * @returns {Promise} API响应
 */
export const createTrack = (data) => {
  return request({
    url: '/api/track',
    method: 'post',
    data
  })
}

/**
 * 更新轨迹
 * @param {string} trackId - 轨迹ID
 * @param {Object} data - 更新数据
 * @returns {Promise} API响应
 */
export const updateTrack = (trackId, data) => {
  return request({
    url: `/api/track/${trackId}`,
    method: 'put',
    data
  })
}

/**
 * 删除轨迹
 * @param {string} trackId - 轨迹ID
 * @returns {Promise} API响应
 */
export const deleteTrack = (trackId) => {
  return request({
    url: `/api/track/${trackId}`,
    method: 'delete'
  })
}

/**
 * 批量删除轨迹
 * @param {Array} trackIds - 轨迹ID数组
 * @returns {Promise} API响应
 */
export const batchDeleteTracks = (trackIds) => {
  return request({
    url: '/api/track/batch',
    method: 'delete',
    data: { trackIds }
  })
}

/**
 * 获取轨迹动画配置
 * @param {string} trackId - 轨迹ID
 * @returns {Promise} API响应
 */
export const getTrackAnimationConfig = (trackId) => {
  return request({
    url: `/api/track/${trackId}/animation`,
    method: 'get'
  })
}

/**
 * 更新轨迹动画配置
 * @param {string} trackId - 轨迹ID
 * @param {Object} config - 动画配置
 * @param {number} config.duration - 动画持续时间(ms)
 * @param {string} config.color - 动画颜色
 * @param {boolean} config.autoPlay - 是否自动播放
 * @param {boolean} config.loop - 是否循环播放
 * @returns {Promise} API响应
 */
export const updateTrackAnimationConfig = (trackId, config) => {
  return request({
    url: `/api/track/${trackId}/animation`,
    method: 'put',
    data: config
  })
}

/**
 * 获取轨迹统计信息
 * @param {Object} params - 查询参数
 * @param {string} params.startTime - 开始时间
 * @param {string} params.endTime - 结束时间
 * @param {string} params.vesselId - 船舶ID
 * @returns {Promise} API响应
 */
export const getTrackStatistics = (params) => {
  return request({
    url: '/api/track/statistics',
    method: 'get',
    params
  })
}

/**
 * 导出轨迹数据
 * @param {Object} params - 导出参数
 * @param {Array} params.trackIds - 轨迹ID数组
 * @param {string} params.format - 导出格式 (json, csv, excel)
 * @returns {Promise} API响应
 */
export const exportTrackData = (params) => {
  return request({
    url: '/api/track/export',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

/**
 * 导入轨迹数据
 * @param {FormData} formData - 包含文件的表单数据
 * @returns {Promise} API响应
 */
export const importTrackData = (formData) => {
  return request({
    url: '/api/track/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取轨迹实时位置
 * @param {string} vesselId - 船舶ID
 * @returns {Promise} API响应
 */
export const getTrackRealTimePosition = (vesselId) => {
  return request({
    url: `/api/track/realtime/${vesselId}`,
    method: 'get'
  })
}

/**
 * 订阅轨迹实时更新
 * @param {string} vesselId - 船舶ID
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消订阅函数
 */
export const subscribeTrackRealTime = (vesselId, callback) => {
  // 这里可以使用WebSocket或其他实时通信方式
  // 示例使用定时器模拟实时更新
  const interval = setInterval(async () => {
    try {
      const response = await getTrackRealTimePosition(vesselId)
      callback(response.data)
    } catch (error) {
      console.error('获取实时位置失败:', error)
    }
  }, 5000) // 每5秒更新一次

  // 返回取消订阅函数
  return () => {
    clearInterval(interval)
  }
}
