/**
 * 拖拽指令
 * 用法：
 * v-draggable - 基础拖拽，整个元素可拖拽
 * v-draggable:class-name - 通过 class 名称查找目标元素（用于 Modal 等组件）
 * v-draggable.handle=".handle" - 指定拖拽手柄（CSS选择器）
 * v-draggable.boundary - 限制在父元素内拖拽
 * v-draggable.x - 只允许水平拖拽
 * v-draggable.y - 只允许垂直拖拽
 * v-draggable="{ handle: '.handle', boundary: true, onStart: () => {}, onMove: () => {}, onEnd: () => {} }" - 配置对象
 * 
 * 示例：
 * v-draggable:my-modal - 查找 .my-modal 元素并使其可拖拽
 */

/**
 * 设置移除监听器，在元素被移除前清空样式
 * @param {HTMLElement} targetEl - 目标元素（Modal）
 * @param {HTMLElement} originalEl - 原始绑定元素
 */
function setupRemoveListener(targetEl, originalEl) {
  // 如果已经设置过，不再重复设置
  if (targetEl._draggableRemoveListenerSetup) {
    return;
  }
  targetEl._draggableRemoveListenerSetup = true;

  // 使用 MutationObserver 监听元素的移除
  const removeObserver = new MutationObserver((mutations, obs) => {
    // 检查目标元素是否被移除
    if (!document.contains(targetEl)) {
      obs.disconnect();
      // 在元素被移除前，清空样式
      if (targetEl && targetEl.style) {
        targetEl.style.left = '';
        targetEl.style.top = '';
        targetEl.style.transform = '';
      }
      delete targetEl._draggableRemoveListenerSetup;
      // 清理原始元素的引用
      if (originalEl._draggableTargetEl === targetEl) {
        delete originalEl._draggableTargetEl;
      }
    }
  });

  // 观察父容器或 body 的变化
  const container = targetEl.parentElement || document.body;
  if (container) {
    removeObserver.observe(container, {
      childList: true,
      subtree: true
    });
  }

  // 存储 observer 以便清理
  targetEl._draggableRemoveObserver = removeObserver;
}

/**
 * 通过 class 名称查找目标元素
 * @param {HTMLElement} el - 指令绑定的元素
 * @param {string} targetClass - 目标元素的 class 名称
 * @param {string} containerSelector - 容器选择器（可选）
 * @returns {HTMLElement|null} 目标 DOM 元素
 */
function findModalElement(el, targetClass = null, containerSelector = null) {
  // 必须指定目标 class 才能查找
  if (!targetClass) {
    return null;
  }

  const classSelector = targetClass.startsWith('.') ? targetClass : `.${targetClass}`;

  // 方法1: 在指定容器中查找
  if (containerSelector) {
    const container = typeof containerSelector === 'string' && containerSelector.startsWith('.')
      ? document.querySelector(containerSelector)
      : (containerSelector === 'body' ? document.body : document.querySelector(containerSelector));

    if (container) {
      const targetEl = container.querySelector(classSelector);
      if (targetEl) {
        return targetEl;
      }
    }
  }

  // 方法2: 在元素属性指定的容器中查找
  if (el.getAttribute) {
    const attrContainerSelector = el.getAttribute('get-container');
    if (attrContainerSelector) {
      const container = typeof attrContainerSelector === 'string' && attrContainerSelector.startsWith('.')
        ? document.querySelector(attrContainerSelector)
        : (attrContainerSelector === 'body' ? document.body : document.querySelector(attrContainerSelector));

      if (container) {
        const targetEl = container.querySelector(classSelector);
        if (targetEl) {
          return targetEl;
        }
      }
    }
  }

  // 方法3: 在整个文档中查找
  const targetEl = document.querySelector(classSelector);
  if (targetEl) {
    return targetEl;
  }

  return null;
}

/**
 * 获取容器选择器（从元素属性或 Vue props 中获取）
 * @param {HTMLElement} el - 目标元素
 * @param {Object} vnode - Vue 节点对象
 * @returns {string} 容器选择器
 */
function getContainerSelector(el, vnode) {
  // 方法1: 从元素属性获取
  if (el.getAttribute) {
    const attr = el.getAttribute('get-container');
    if (attr) return attr;
  }

  // 方法2: 从 Vue props 获取（组件的情况）
  if (vnode?.props) {
    const getContainer = vnode.props['get-container'] || vnode.props.getContainer;
    if (getContainer) {
      return typeof getContainer === 'string' ? getContainer : getContainer.value;
    }
  }

  // 方法3: 从 class 中推断（如果有 modal-container）
  if (el.classList?.contains('modal-container')) {
    return '.ui-container';
  }

  return '.ui-container';
}

/**
 * 初始化拖拽功能
 * @param {HTMLElement} el - 目标元素
 * @param {Object} binding - 指令绑定对象
 * @param {Object} instance - Vue 组件实例（用于 nextTick）
 * @param {Object} vnode - Vue 节点对象（用于获取 props）
 */
function initDraggable(el, binding, instance, vnode) {
  // 获取指令参数（class 名称）
  const targetClass = binding.arg;

  // 如果指定了目标 class，需要查找目标元素
  if (targetClass) {
    let retryCount = 0;
    const maxRetries = 40; // 最多重试 40 次（2秒）
    let found = false;

    // 获取容器选择器
    const containerSelector = getContainerSelector(el, vnode);

    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver((mutations, obs) => {
      if (found) return;

      const targetEl = findModalElement(el, targetClass, containerSelector);
      if (targetEl) {
        found = true;
        obs.disconnect();
        // 找到目标元素，初始化拖拽
        initDraggableOnElement(targetEl, binding, el);
      }
    });

    // 开始观察
    const container = typeof containerSelector === 'string' && containerSelector.startsWith('.')
      ? document.querySelector(containerSelector)
      : (containerSelector === 'body' ? document.body : document.querySelector(containerSelector));

    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true
      });
    }

    // 同时使用定时器作为备用方案
    const tryInit = () => {
      if (found) return;

      const targetEl = findModalElement(el, targetClass, containerSelector);
      if (targetEl) {
        found = true;
        observer.disconnect();
        // 如果目标元素没有指定的 class，自动添加
        if (targetClass && !targetEl.classList.contains(targetClass)) {
          targetEl.classList.add(targetClass);
        }

        // 设置移除监听器，在元素被移除前清空样式
        setupRemoveListener(targetEl, el);

        initDraggableOnElement(targetEl, binding, el);
      } else if (retryCount++ < maxRetries) {
        setTimeout(tryInit, 50);
      } else {
        observer.disconnect();
        console.warn('[v-draggable] 无法找到目标元素，已重试', maxRetries, '次');
        console.warn('[v-draggable] 查找的 class:', targetClass);
        console.warn('[v-draggable] 元素:', el);
        console.warn('[v-draggable] 容器选择器:', containerSelector);
        console.warn('[v-draggable] 容器:', container);
      }
    };

    // 使用 nextTick 或 Promise 延迟执行
    const startInit = () => {
      // 立即尝试一次
      tryInit();
    };

    if (instance && instance.$nextTick) {
      instance.$nextTick(startInit);
    } else {
      Promise.resolve().then(() => {
        setTimeout(startInit, 100);
      });
    }

    // 存储 observer 以便清理
    el._draggableObserver = observer;
    return;
  }

  // 没有指定 class，直接使用绑定的元素
  initDraggableOnElement(el, binding);
}

/**
 * 在指定元素上初始化拖拽功能
 * @param {HTMLElement} el - 目标元素
 * @param {Object} binding - 指令绑定对象
 * @param {HTMLElement} originalEl - 原始绑定元素（用于 Modal 场景）
 */
function initDraggableOnElement(el, binding, originalEl = null) {
  // 确保元素有定位
  const computedStyle = window.getComputedStyle(el);
  const currentPosition = computedStyle.position;
  const isFixed = currentPosition === 'fixed';
  const isAbsolute = currentPosition === 'absolute';

  // 如果元素没有定位，设置为 relative
  if (currentPosition === 'static' || currentPosition === '') {
    el.style.position = 'relative';
  }

  // 存储定位方式，用于后续的位置更新
  el._draggablePositionType = isFixed ? 'fixed' : (isAbsolute ? 'absolute' : 'relative');

  // 解析配置
  const { value, modifiers } = binding;
  const options = {
    handle: null, // 拖拽手柄选择器
    boundary: modifiers.boundary || false, // 是否限制在父元素内
    axis: modifiers.x ? 'x' : modifiers.y ? 'y' : null, // 拖拽方向限制
    onStart: null, // 拖拽开始回调
    onMove: null, // 拖拽中回调
    onEnd: null, // 拖拽结束回调
    ...(typeof value === 'object' ? value : {})
  };

  // 如果是 Modal，默认使用 header 作为拖拽手柄
  const isModal = el.classList?.contains('ant-modal') || el.querySelector?.('.ant-modal-header');
  if (isModal && !options.handle) {
    options.handle = '.ant-modal-header';
  }

  // 存储配置
  el._draggableOptions = options;
  if (originalEl) {
    originalEl._draggableTargetEl = el;
  }
  el._draggableState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    currentX: 0,
    currentY: 0,
    xOffset: 0,
    yOffset: 0
  };

  // 获取拖拽手柄元素
  let handleEl = null;
  if (options.handle) {
    handleEl = el.querySelector(options.handle);
    if (!handleEl) {
      console.warn(`[v-draggable] 未找到拖拽手柄: ${options.handle}，将使用整个元素作为拖拽区域`);
      handleEl = el;
    }
  } else {
    handleEl = el;
  }

  if (!handleEl) {
    console.error(`[v-draggable] 无法初始化拖拽：找不到目标元素`);
    return;
  }

  // 设置拖拽手柄样式
  handleEl.style.cursor = 'move';
  handleEl.style.userSelect = 'none';

  // 拖拽开始
  const onDragStart = (e) => {
    // 如果指定了拖拽手柄，检查点击是否在手柄内
    if (options.handle) {
      const clickedHandle = e.target.closest(options.handle);
      if (!clickedHandle || !handleEl.contains(clickedHandle)) {
        return;
      }
    }

    el._draggableState.isDragging = true;

    // 获取鼠标/触摸位置
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    el._draggableState.startX = clientX;
    el._draggableState.startY = clientY;

    // 获取元素当前位置
    const rect = el.getBoundingClientRect();

    // 根据定位方式获取初始位置
    if (el._draggablePositionType === 'fixed') {
      // fixed 定位：使用 getBoundingClientRect 获取实际位置
      // 因为 left/top 可能是 auto，需要通过计算得到
      const left = Number.parseFloat(computedStyle.left);
      const top = Number.parseFloat(computedStyle.top);

      // 如果 left/top 是 auto 或无效值，使用 getBoundingClientRect
      if (Number.isNaN(left) || computedStyle.left === 'auto') {
        el._draggableState.initialX = rect.left;
        el._draggableState.xOffset = rect.left;
      } else {
        el._draggableState.initialX = left;
        el._draggableState.xOffset = left;
      }

      if (Number.isNaN(top) || computedStyle.top === 'auto') {
        el._draggableState.initialY = rect.top;
        el._draggableState.yOffset = rect.top;
      } else {
        el._draggableState.initialY = top;
        el._draggableState.yOffset = top;
      }
    } else {
      // relative/absolute 定位：使用 transform
      const transform = computedStyle.transform;
      if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => Number.parseFloat(v.trim()));
          el._draggableState.xOffset = values[4] || 0;
          el._draggableState.yOffset = values[5] || 0;
        } else {
          el._draggableState.xOffset = 0;
          el._draggableState.yOffset = 0;
        }
      } else {
        el._draggableState.xOffset = 0;
        el._draggableState.yOffset = 0;
      }
      el._draggableState.initialX = el._draggableState.xOffset;
      el._draggableState.initialY = el._draggableState.yOffset;
    }

    // 调用开始回调
    if (options.onStart) {
      options.onStart(e, {
        x: el._draggableState.xOffset,
        y: el._draggableState.yOffset
      });
    }

    // 阻止默认行为
    e.preventDefault();
  };

  // 拖拽中
  const onDrag = (e) => {
    // 检查状态是否存在（防止元素被清理后事件还在触发）
    if (!el._draggableState || !el._draggableState.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // 计算移动距离
    const deltaX = clientX - el._draggableState.startX;
    const deltaY = clientY - el._draggableState.startY;

    // 计算新偏移量
    let newX = el._draggableState.initialX + deltaX;
    let newY = el._draggableState.initialY + deltaY;

    // 应用方向限制
    if (options.axis === 'x') {
      newY = el._draggableState.initialY;
    } else if (options.axis === 'y') {
      newX = el._draggableState.initialX;
    }

    // 边界限制
    if (options.boundary) {
      const elRect = el.getBoundingClientRect();

      if (el._draggablePositionType === 'fixed') {
        // fixed 定位：限制在视口内
        const minX = 0;
        const maxX = window.innerWidth - elRect.width;
        const minY = 0;
        const maxY = window.innerHeight - elRect.height;

        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));
      } else if (el.parentElement) {
        // relative/absolute 定位：限制在父元素内
        const parentRect = el.parentElement.getBoundingClientRect();

        // 计算元素在父元素中的相对位置
        const parentLeft = parentRect.left;
        const parentTop = parentRect.top;
        const elLeft = elRect.left;
        const elTop = elRect.top;

        // 计算当前偏移量对应的实际位置
        const currentLeft = elLeft - parentLeft;
        const currentTop = elTop - parentTop;

        // 计算新位置
        const newLeft = currentLeft + deltaX;
        const newTop = currentTop + deltaY;

        // 限制在父元素范围内
        const minX = 0;
        const maxX = parentRect.width - elRect.width;
        const minY = 0;
        const maxY = parentRect.height - elRect.height;

        const clampedLeft = Math.max(minX, Math.min(newLeft, maxX));
        const clampedTop = Math.max(minY, Math.min(newTop, maxY));

        // 计算需要调整的偏移量
        const adjustX = clampedLeft - newLeft;
        const adjustY = clampedTop - newTop;

        newX += adjustX;
        newY += adjustY;
      }
    }

    // 更新位置
    el._draggableState.currentX = newX;
    el._draggableState.currentY = newY;

    // 根据定位方式应用位置
    if (el._draggablePositionType === 'fixed') {
      // fixed 定位：使用 left 和 top
      if (options.axis === 'x') {
        el.style.left = `${newX}px`;
      } else if (options.axis === 'y') {
        el.style.top = `${newY}px`;
      } else {
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      }
    } else {
      // relative/absolute 定位：使用 transform
      if (options.axis === 'x') {
        el.style.transform = `translate(${newX}px, 0)`;
      } else if (options.axis === 'y') {
        el.style.transform = `translate(0, ${newY}px)`;
      } else {
        el.style.transform = `translate(${newX}px, ${newY}px)`;
      }
    }

    // 调用移动回调
    if (options.onMove) {
      options.onMove(e, {
        x: newX,
        y: newY,
        deltaX: newX - el._draggableState.initialX,
        deltaY: newY - el._draggableState.initialY
      });
    }

    e.preventDefault();
  };

  // 拖拽结束
  const onDragEnd = (e) => {
    // 检查状态是否存在（防止元素被清理后事件还在触发）
    if (!el._draggableState || !el._draggableState.isDragging) return;

    el._draggableState.isDragging = false;

    // 调用结束回调
    if (options.onEnd) {
      options.onEnd(e, {
        x: el._draggableState.currentX,
        y: el._draggableState.currentY,
        deltaX: el._draggableState.currentX - el._draggableState.initialX,
        deltaY: el._draggableState.currentY - el._draggableState.initialY
      });
    }
  };

  // 绑定事件
  const bindEvents = () => {
    // 鼠标事件
    handleEl.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onDragEnd);

    // 触摸事件（移动端支持）
    handleEl.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    // 存储事件处理函数以便清理
    el._draggableHandlers = {
      handleEl,
      onDragStart,
      onDrag,
      onDragEnd
    };
  };

  // 解绑事件
  const unbindEvents = () => {
    if (el._draggableHandlers) {
      const { handleEl, onDragStart, onDrag, onDragEnd } = el._draggableHandlers;

      handleEl.removeEventListener('mousedown', onDragStart);
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', onDragEnd);

      handleEl.removeEventListener('touchstart', onDragStart);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', onDragEnd);

      delete el._draggableHandlers;
    }
  };

  // 初始化
  bindEvents();

  // 存储解绑函数
  el._draggableUnbind = unbindEvents;
}

/**
 * 清理拖拽功能
 * @param {HTMLElement} el - 目标元素
 */
function cleanupDraggable(el) {
  // 清理移除监听器
  if (el._draggableRemoveObserver) {
    el._draggableRemoveObserver.disconnect();
    delete el._draggableRemoveObserver;
  }
  delete el._draggableRemoveListenerSetup;

  // 清理 MutationObserver
  if (el._draggableObserver) {
    el._draggableObserver.disconnect();
    delete el._draggableObserver;
  }

  if (el._draggableUnbind) {
    el._draggableUnbind();
    delete el._draggableUnbind;
  }

  // 重置位置样式（清空所有可能的位置样式）
  if (el && el.style) {
    el.style.left = '';
    el.style.top = '';
    el.style.transform = '';
  }

  // 清理状态
  delete el._draggableOptions;
  delete el._draggableState;
  delete el._draggablePositionType;

  // 恢复样式
  if (el._draggableHandlers?.handleEl) {
    el._draggableHandlers.handleEl.style.cursor = '';
    el._draggableHandlers.handleEl.style.userSelect = '';
  }
}

// 指令定义
export const vDraggable = {
  mounted(el, binding, vnode) {
    const instance = vnode?.ctx || vnode?.componentInstance;
    initDraggable(el, binding, instance, vnode);
  },

  updated(el, binding, vnode) {
    // 如果指定了目标 class，每次 updated 都尝试重新初始化（因为目标元素可能刚渲染）
    const hasTargetClass = !!binding.arg;

    // 如果已经初始化过，检查目标元素是否还存在
    if (el._draggableTargetEl) {
      const targetEl = el._draggableTargetEl;
      // 检查元素是否还在 DOM 中
      if (!document.contains(targetEl)) {
        // 元素已被移除，清理并重置
        cleanupDraggable(targetEl);
        delete el._draggableTargetEl;
      }
      // 注意：如果元素还在 DOM 中，setupRemoveListener 已经设置了监听器来监听移除
    }

    if (hasTargetClass) {
      // 检查是否已经初始化过
      if (!el._draggableTargetEl) {
        const instance = vnode?.ctx || vnode?.componentInstance;
        initDraggable(el, binding, instance, vnode);
      }
    } else {
      // 如果配置发生变化，重新初始化
      const { value, oldValue } = binding;
      if (value !== oldValue) {
        // 清理目标元素
        const targetEl = el._draggableTargetEl || el;
        cleanupDraggable(targetEl);
        if (el._draggableTargetEl) {
          delete el._draggableTargetEl;
        }

        const instance = vnode?.ctx || vnode?.componentInstance;
        initDraggable(el, binding, instance, vnode);
      }
    }
  },

  unmounted(el) {
    // 清理移除观察器
    if (el._draggableRemoveObserver) {
      el._draggableRemoveObserver.disconnect();
      delete el._draggableRemoveObserver;
    }

    // 清理目标元素（可能是 Modal 的实际 DOM）
    const targetEl = el._draggableTargetEl || el;

    // 在卸载前，确保清空样式
    if (targetEl && targetEl.style) {
      targetEl.style.left = '';
      targetEl.style.top = '';
      targetEl.style.transform = '';
    }

    cleanupDraggable(targetEl);
    if (el._draggableTargetEl) {
      delete el._draggableTargetEl;
    }
    delete el._draggableModalId;
  }
};

export default vDraggable;
