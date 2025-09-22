
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
/**
 * 创建船舶弹窗内容
 * @param {Object} markerData - 标记点数据
 * @returns {String} HTML内容
 */
export function createPopupContentShip(markerData, setKeyShip, viewMore, shipQuery) {
  // 将函数绑定到全局对象，以便在HTML中调用
  if (shipQuery && typeof shipQuery === 'function') {
    window.shipQueryFunction = shipQuery;
  }

  if (viewMore && typeof viewMore === 'function') {
    window.viewMoreShipFunction = viewMore;
  }
  if (setKeyShip && typeof setKeyShip === 'function') {
    window.setKeyShipFunction = setKeyShip;
  }

  return `
    <div class="ship-popup">
      <div class="popup-header">
        <h3 class="popup-title">船舶信息</h3>
        <div class="popup-actions">
          <span class="view-detail" onclick="window.viewMoreShipFunction && window.viewMoreShipFunction('${markerData.markerId}')">查看详细信息 ></span>
          <button class="popup-close" onclick="this.closest('.marker-popup-container').style.display='none'">×</button>
        </div>
      </div>
      
      <div class="popup-content">
        <div class="ship-details">
          <div class="details-left">
            <div class="info-row">
              <span class="info-label">ID号：</span>
              <span class="info-value">${markerData.id || '7247429083012608'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">中文船名：</span>
              <span class="info-value">${markerData.chineseName || markerData.shipName || '船名'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">船舶类型：</span>
              <span class="info-value">${markerData.shipType || '货船'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">呼号：</span>
              <span class="info-value">${markerData.callSign || 'HGHF'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">经度：</span>
              <span class="info-value">${markerData.longitude || '121.805162'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">航向：</span>
              <span class="info-value">${markerData.course || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">船首向：</span>
              <span class="info-value">${markerData.heading || '413452860'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">吃水：</span>
              <span class="info-value">${markerData.draft || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">预计到达时间：</span>
              <span class="info-value">${markerData.eta || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">信号来源：</span>
              <span class="info-value">${markerData.signalSource || '雷达数据'}</span>
            </div>
          </div>
          
          <div class="details-right">
            <div class="info-row">
              <span class="info-label">MMSI：</span>
              <span class="info-value">${markerData.mmsi || '413452860'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">英文船名：</span>
              <span class="info-value">${markerData.englishName || 'NB PILOT BOAT 28'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">航行状态：</span>
              <span class="info-value status-navigation">${markerData.navigationStatus || '在航(主机推动)'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">IMO：</span>
              <span class="info-value">${markerData.imo || '9073783'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">纬度：</span>
              <span class="info-value">${markerData.latitude || '30.00297'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">速率：</span>
              <span class="info-value">${markerData.speed || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">船长宽(米)：</span>
              <span class="info-value">${markerData.dimensions || '185*32'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">目的地：</span>
              <span class="info-value">${markerData.destination || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">数据更新时间：</span>
              <span class="info-value">${markerData.updateTime || '-'}</span>
            </div>
          </div>
        </div>
        
        <div class="ship-image-section">
          <div class="ship-image-container">
            <img src="${markerData.shipImage || new URL('@/assets/imgs/truck2.png', import.meta.url).href}" alt="船舶图片" class="ship-photo">
            <div class="key-ship-badge">重点船舶</div>
          </div>
          <button class="set-key-ship-btn" onclick="window.setKeyShipFunction && window.setKeyShipFunction('${markerData.markerId}')">
            <i class="ship-icon">🚢</i>
            设置重点船舶
          </button>
        </div>
      </div>
      
      <div class="popup-footer">
        <div class="track-query-section">
          <div class="track-query-header">轨迹查询</div>
          <div class="track-query-controls">
            <input type="text" class="track-query-input" placeholder="请输入查询条件">
            <button class="query-btn" onclick="window.shipQueryFunction && window.shipQueryFunction('${markerData.markerId}')">查询</button>
            <button class="cancel-btn">取消</button>
          </div>
        </div>
      </div>
    </div>
  `;
};
