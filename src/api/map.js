import request from '@/utils/request'

/**
 * 获取地图配置
 * @returns {Promise} API响应
 */
export const getShorelineLayer = () => {
  return request({
    url: '/fzsRiskPoint/shorelineLayer',
    method: 'get'
  })
}
/**
 * 登录
 * @returns {Promise} API响应
 */
export const login = (data) => {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}
