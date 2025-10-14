
/**
 * 创建可疑车辆弹窗内容
 * @param {Object} markerData - 标记点数据
 * @returns {String} HTML内容
 */
export function createPopupContentCar(markerData, trackBack, viewMore, cancelTrack) {
  console.log("🚀 ~ createPopupContentCar ~ markerData:", markerData)
  // 将函数绑定到全局对象，以便在HTML中调用
  if (trackBack && typeof trackBack === 'function') {
    window.trackBackFunction = trackBack;
  }

  if (viewMore && typeof viewMore === 'function') {
    window.viewMoreFunction = viewMore;
  }
  if (cancelTrack && typeof cancelTrack === 'function') {
    window.cancelFunction = cancelTrack;
  }

  return `
    <div class="vehicle-popup">
      <div class="popup-header">
        <h3 class="popup-title">${markerData.title || '可疑车辆'}</h3>
        <button class="popup-close" onclick="window.cancelFunction && window.cancelFunction('${markerData.markerId}')">×</button>
      </div>
      <div class="popup-content">
        <div class="vehicle-image">
          <img src="${new URL('@/assets/imgs/car.png', import.meta.url).href}" alt="车辆图片" class="vehicle-photo">
        </div>
        
        <div class="vehicle-info">
          <div class="info-row">
            <span class="info-label">车牌号</span>
            <span class="info-value">${markerData.shipName || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">类型</span>
            <span class="info-value">${markerData.vehicleType || markerData.type || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">状态</span>
            <span class="info-value status-driving">${markerData.status || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">标签</span>
            <span class="info-value tag-smuggling">${markerData.tag || ''}</span>
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
export function createPopupContentRisk(markerData, trackCorrect, viewMoreCorrect, cancelCorrect) {
  // 将函数绑定到全局对象，以便在HTML中调用
  if (trackCorrect && typeof trackCorrect === 'function') {
    window.trackCorrectFunction = trackCorrect;
  }

  if (viewMoreCorrect && typeof viewMoreCorrect === 'function') {
    window.viewMoreCorrectFunction = viewMoreCorrect;
  }
  if (cancelCorrect && typeof cancelCorrect === 'function') {
    window.cancelFunction = cancelCorrect;
  }

  return `
    <div class="vehicle-popup">
      <div class="popup-header">
        <h3 class="popup-title">${markerData.title || '风险点'}</h3>
        <button class="popup-close" onclick="window.cancelFunction && window.cancelFunction('${markerData.markerId}')">×</button>
      </div>
      <div class="popup-content">
        <div class="vehicle-image">
          <img src="${new URL('@/assets/imgs/car.png', import.meta.url).href}" alt="车辆图片" class="vehicle-photo">
        </div>
        
        <div class="vehicle-info">
          <div class="info-row">
            <span class="info-label">名称</span>
            <span class="info-value">${markerData.name || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">类型</span>
            <span class="info-value">${markerData.riskType || markerData.type || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">单位</span>
            <span class="info-value status-driving">${markerData.dept || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">负责人</span>
            <span class="info-value tag-smuggling">${markerData.principal || ''}</span>
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
export function createPopupContentShip(markerData, setKeyShip, viewMore, shipQuery, cancelShip) {
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
  if (cancelShip && typeof cancelShip === 'function') {
    window.cancelFunction = cancelShip;
  }
  return `
    <div class="ship-popup">
      <div class="popup-header">
        <h3 class="popup-title">船舶信息</h3>
        <div class="popup-actions">
          <span class="view-detail" onclick="window.viewMoreShipFunction && window.viewMoreShipFunction('${markerData.markerId}')">查看详细信息 ></span>
          <button class="popup-close" onclick="window.cancelFunction && window.cancelFunction('${markerData.markerId}')">×</button>
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
            <button class="cancel-btn"  onclick="window.cancelFunction && window.cancelFunction('${markerData.markerId}')">取消</button>
          </div>
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
export function createPopupMenuShip(markerData, setKeyShip, viewMore, shipQuery) {
  // 将函数绑定到全局对象，以便在HTML中调用
  if (setKeyShip && typeof setKeyShip === 'function') {
    window.setKeyShipFunction = setKeyShip;
  }

  if (viewMore && typeof viewMore === 'function') {
    window.viewMoreShipFunction = viewMore;
  }

  if (shipQuery && typeof shipQuery === 'function') {
    window.shipQueryFunction = shipQuery;
  }

  // 绑定其他功能函数
  window.startTargetIndicationFunction = (markerId) => {
    console.log("启动目标指示:", markerId);
  };

  window.selectMultiPhotoelectricFunction = (markerId) => {
    console.log("选择多光电指示:", markerId);
    // 切换子菜单显示状态
    const submenu = document.querySelector('.photoelectric-submenu');
    if (submenu) {
      submenu.style.display = submenu.style.display === 'none' ? 'block' : 'none';
    }
  };

  // 光电设备选择功能
  window.selectPhotoelectricDevice = (markerId, deviceName, distance, event) => {
    event.stopPropagation();
    console.log("选择光电设备:", deviceName, "距离:", distance, "船舶ID:", markerId, "事件:", event);

    // 切换复选框状态
    const checkbox = event.target.querySelector('.checkbox');
    if (checkbox) {
      if (checkbox.textContent === '☐') {
        checkbox.textContent = '☑';
        checkbox.style.color = '#00ffff';
      } else {
        checkbox.textContent = '☐';
        checkbox.style.color = 'rgba(255, 255, 255, 0.7)';
      }
    }

  };

  window.cancelAllTrackingFunction = (markerId) => {
    console.log("取消所有跟踪:", markerId);
  };

  window.displayAllTracksFunction = (markerId) => {
    console.log("显示所有航迹:", markerId);
  };

  window.cancelAllTracksFunction = (markerId) => {
    console.log("取消所有航迹:", markerId);
  };

  window.displayTargetProfileFunction = (markerId) => {
    console.log("显示目标档案:", markerId);
  };

  window.copyTargetIdFunction = (markerId) => {
    console.log("复制当前目标ID:", markerId);
    const targetId = markerData.id || markerData.markerId || '未知ID';
    navigator.clipboard.writeText(targetId).then(() => {
      console.log("目标ID已复制到剪贴板");
    });
  };

  window.copyTargetMmsiFunction = (markerId) => {
    console.log("复制当前目标MMSI:", markerId);
    const mmsi = markerData.mmsi || '未知MMSI';
    navigator.clipboard.writeText(mmsi).then(() => {
      console.log("MMSI已复制到剪贴板");
    });
  };

  window.copyCoordinatesFunction = (markerId) => {
    console.log("复制当前坐标:", markerId);
    const coordinates = `${markerData.longitude || '0'}, ${markerData.latitude || '0'}`;
    navigator.clipboard.writeText(coordinates).then(() => {
      console.log("坐标已复制到剪贴板");
    });
  };

  return `
    <div class="ship-context-menu">
      <div class="menu-section">
        <div class="close-submenu" onclick="this.closest('.ship-context-menu').style.display='none'">
          ×
        </div>
        <div class="menu-item" onclick="window.startTargetIndicationFunction('${markerData.markerId}')">
          启动目标指示
        </div>
        <div class="menu-item menu-item-with-submenu" onclick="window.selectMultiPhotoelectricFunction('${markerData.markerId}')">
          选择多光电指示
          <div class="photoelectric-submenu" style="display: none;">
            <div class="submenu-item" onclick="window.selectPhotoelectricDevice('${markerData.markerId}', '乐清西门岛', '175.92', event)">
              <span class="checkbox">☐</span>
              乐清西门岛 (175.92 Km)
            </div>
            <div class="submenu-item" onclick="window.selectPhotoelectricDevice('${markerData.markerId}', '乐清管委会', '197.21', event)">
              <span class="checkbox">☐</span>
              乐清管委会 (197.21 Km)
            </div>
            <div class="submenu-item" onclick="window.selectPhotoelectricDevice('${markerData.markerId}', '乐清黄华民兵哨所', '220.61', event)">
              <span class="checkbox">☐</span>
              乐清黄华民兵哨所 (220.61 Km)
            </div>
            <div class="submenu-item" onclick="window.selectPhotoelectricDevice('${markerData.markerId}', '永嘉东蒙山', '224.85', event)">
              <span class="checkbox">☐</span>
              永嘉东蒙山 (224.85 Km)
            </div>
            <div class="submenu-item" onclick="window.selectPhotoelectricDevice('${markerData.markerId}', '瑞安阅巷油库', '260.56', event)">
              <span class="checkbox">☐</span>
              瑞安阅巷油库 (260.56 Km)
            </div>
            <div class="submenu-item" onclick="window.selectPhotoelectricDevice('${markerData.markerId}', '平阳鳌江圣荣池', '274.24', event)">
              <span class="checkbox">☐</span>
              平阳鳌江圣荣池 (274.24 Km)
            </div>
          </div>
        </div>
        <div class="menu-item" onclick="window.cancelAllTrackingFunction('${markerData.markerId}')">
          取消所有跟踪
        </div>
      </div>
      
      <div class="menu-divider"></div>
      
      <div class="menu-section">
        <div class="menu-item menu-item-with-submenu" onclick="window.shipQueryFunction('${markerData.markerId}')">
          航迹
        </div>
      </div>
      
      <div class="menu-divider"></div>
      
      <div class="menu-section">
        <div class="menu-item" onclick="window.displayAllTracksFunction('${markerData.markerId}')">
          显示所有航迹
        </div>
        <div class="menu-item" onclick="window.cancelAllTracksFunction('${markerData.markerId}')">
          取消所有航迹
        </div>
      </div>
      
      <div class="menu-divider"></div>
      
      <div class="menu-section">
        <div class="menu-item" onclick="window.setKeyShipFunction('${markerData.markerId}')">
          设为重点船舶
        </div>
        <div class="menu-item" onclick="window.displayTargetProfileFunction('${markerData.markerId}')">
          显示目标档案
        </div>
      </div>
      
      <div class="menu-divider"></div>
      
      <div class="menu-section">
        <div class="menu-item" onclick="window.copyTargetIdFunction('${markerData.markerId}')">
          复制当前目标ID
        </div>
        <div class="menu-item" onclick="window.copyTargetMmsiFunction('${markerData.markerId}')">
          复制当前目标MMSI
        </div>
        <div class="menu-item" onclick="window.copyCoordinatesFunction('${markerData.markerId}')">
          复制当前坐标
        </div>
      </div>
    </div>
  `;
};
