/**
 * 坐标生成工具
 * 用于在指定位置周围生成随机坐标点
 */

/**
 * 将角度转换为弧度
 * @param {number} degrees 角度
 * @returns {number} 弧度
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 将弧度转换为角度
 * @param {number} radians 弧度
 * @returns {number} 角度
 */
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * 计算两点之间的距离（公里）
 * @param {number} lat1 纬度1
 * @param {number} lon1 经度1
 * @param {number} lat2 纬度2
 * @param {number} lon2 经度2
 * @returns {number} 距离（公里）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
      * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 在指定位置周围生成随机坐标点
 * @param {number} centerLat 中心纬度
 * @param {number} centerLon 中心经度
 * @param {number} radiusKm 半径（公里）
 * @param {number} count 生成数量
 * @returns {Array} 坐标点数组
 */
export function generateRandomCoordinates(centerLat, centerLon, radiusKm, count = 10) {
  const coordinates = [];

  for (let i = 0; i < count; i++) {
    // 生成随机距离（0到radiusKm之间）
    const distance = Math.random() * radiusKm;

    // 生成随机角度（0到360度）
    const angle = Math.random() * 2 * Math.PI;

    // 计算新坐标
    const R = 6371; // 地球半径（公里）
    const lat1 = toRadians(centerLat);
    const lon1 = toRadians(centerLon);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R)
      + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(angle)
    );

    const lon2 = lon1 + Math.atan2(
      Math.sin(angle) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    const newLat = toDegrees(lat2);
    const newLon = toDegrees(lon2);

    // 验证距离
    const actualDistance = calculateDistance(centerLat, centerLon, newLat, newLon);

    coordinates.push({
      lat: newLat,
      lng: newLon,
      distance: actualDistance,
      id: `point_${i + 1}`
    });
  }

  return coordinates;
}

/**
 * 在指定位置周围生成网格坐标点
 * @param {number} centerLat 中心纬度
 * @param {number} centerLon 中心经度
 * @param {number} radiusKm 半径（公里）
 * @param {number} gridSize 网格大小（每边的点数）
 * @returns {Array} 坐标点数组
 */
export function generateGridCoordinates(centerLat, centerLon, radiusKm, gridSize = 5) {
  const coordinates = [];
  const step = (radiusKm * 2) / (gridSize - 1);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = (i * step) - radiusKm;
      const y = (j * step) - radiusKm;

      // 计算距离
      const distance = Math.sqrt(x * x + y * y);

      if (distance <= radiusKm) {
        // 将相对坐标转换为经纬度
        const latOffset = (y / 111); // 1度纬度约等于111公里
        const lonOffset = (x / (111 * Math.cos(toRadians(centerLat))));

        const newLat = centerLat + latOffset;
        const newLon = centerLon + lonOffset;

        coordinates.push({
          lat: newLat,
          lng: newLon,
          distance,
          id: `grid_${i}_${j}`
        });
      }
    }
  }

  return coordinates;
}

/**
 * 生成圆形分布的坐标点
 * @param {number} centerLat 中心纬度
 * @param {number} centerLon 中心经度
 * @param {number} radiusKm 半径（公里）
 * @param {number} count 生成数量
 * @returns {Array} 坐标点数组
 */
export function generateCircleCoordinates(centerLat, centerLon, radiusKm, count = 8) {
  const coordinates = [];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const distance = radiusKm * 0.8; // 在半径的80%处生成点

    const R = 6371; // 地球半径（公里）
    const lat1 = toRadians(centerLat);
    const lon1 = toRadians(centerLon);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R)
      + Math.cos(lat1) * Math.sin(distance / R) * Math.cos(angle)
    );

    const lon2 = lon1 + Math.atan2(
      Math.sin(angle) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    const newLat = toDegrees(lat2);
    const newLon = toDegrees(lon2);

    coordinates.push({
      lat: newLat,
      lng: newLon,
      distance,
      id: `circle_${i + 1}`
    });
  }

  return coordinates;
}
