
/**
 * 创建可疑车辆弹窗内容
 * @param {Object} markerData - 标记点数据
 * @returns {String} HTML内容
 */
export function createPopupContentCar(markerData, trackBack, viewMore) {
    // 将函数绑定到全局对象，以便在HTML中调用
    if (trackBack && typeof trackBack === 'function') {
        window.trackBackFunction = trackBack;
    }

    if (viewMore && typeof viewMore === 'function') {
        window.viewMoreFunction = viewMore;
    }

    return `
    <div class="vehicle-popup">
      <div class="popup-header">
        <h3 class="popup-title">${markerData.title || '可疑车辆'}</h3>
        <button class="popup-close" onclick="this.closest('.marker-popup-container').style.display='none'">×</button>
      </div>
      <div class="popup-content">
        <div class="vehicle-image">
          <img src="${new URL('@/assets/imgs/car.png', import.meta.url).href}" alt="车辆图片" class="vehicle-photo">
        </div>
        
        <div class="vehicle-info">
          <div class="info-row">
            <span class="info-label">车牌号</span>
            <span class="info-value">${markerData.shipName || '浙J35472'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">类型</span>
            <span class="info-value">${markerData.vehicleType || markerData.type || '高栏货车'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">状态</span>
            <span class="info-value status-driving">${markerData.状态 || '行驶中'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">标签</span>
            <span class="info-value tag-smuggling">${markerData.tag || '涉私车辆'}</span>
          </div>
        </div>
      </div>
      
      <div class="popup-footer">
        <div class="track-btn" onclick="window.trackBackFunction && window.trackBackFunction('${markerData.markerId}')">
          轨迹回放
        </div>
        <div class="more-btn" onclick="window.viewMoreFunction && window.viewMoreFunction('${markerData.markerId}')">
          查看更多
        </div>
      </div>
    </div>
  `;
};
/**
 * 创建风险点弹窗内容
 * @param {Object} markerData - 标记点数据
 * @returns {String} HTML内容
 */
export function createPopupContentRisk(markerData, trackCorrect, viewMoreCorrect) {
    // 将函数绑定到全局对象，以便在HTML中调用
    if (trackCorrect && typeof trackCorrect === 'function') {
        window.trackCorrectFunction = trackCorrect;
    }

    if (viewMoreCorrect && typeof viewMoreCorrect === 'function') {
        window.viewMoreCorrectFunction = viewMoreCorrect;
    }

    return `
    <div class="vehicle-popup">
      <div class="popup-header">
        <h3 class="popup-title">${markerData.title1 || '风险点'}</h3>
        <button class="popup-close" onclick="this.closest('.marker-popup-container').style.display='none'">×</button>
      </div>
      <div class="popup-content">
        <div class="vehicle-image">
          <img src="${new URL('@/assets/imgs/car.png', import.meta.url).href}" alt="车辆图片" class="vehicle-photo">
        </div>
        
        <div class="vehicle-info">
          <div class="info-row">
            <span class="info-label">名称</span>
            <span class="info-value">${markerData.shipName || '风险点'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">类型</span>
            <span class="info-value">${markerData.riskType || markerData.type || '正常码头'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">单位</span>
            <span class="info-value status-driving">${markerData.dept || '风险点'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">负责人</span>
            <span class="info-value tag-smuggling">${markerData.principal || '李四'}</span>
          </div>
        </div>
      </div>
      
      <div class="popup-footer">
        <div class="track-btn" onclick="window.trackCorrectFunction && window.trackCorrectFunction('${markerData.markerId}')">
          位置纠偏
        </div>
        <div class="more-btn" onclick="window.viewMoreCorrectFunction && window.viewMoreCorrectFunction('${markerData.markerId}')">
          查看更多
        </div>
      </div>
    </div>
  `;
};
