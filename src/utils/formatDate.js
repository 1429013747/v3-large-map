/**
 * 格式化日期为字符串
 * @param {Date} date 要格式化的日期对象
 * @param {string} format 格式化模式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export default function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date || !(date instanceof Date)) {
    return ''
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  // 补零函数
  const pad = (num) => {
    return num.toString().padStart(2, '0')
  }

  // 替换格式字符串
  return format
    .replace('YYYY', year)
    .replace('MM', pad(month))
    .replace('DD', pad(day))
    .replace('HH', pad(hour))
    .replace('mm', pad(minute))
    .replace('ss', pad(second))
}
