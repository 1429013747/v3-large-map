/**
 * Loading 指令
 * 用法：
 * v-loading="loadingState" - 绑定响应式变量
 * v-loading:body="loadingState" - 在 body 上显示 loading
 * v-loading.fullscreen="loadingState" - 全屏 loading
 * v-loading.custom="loadingState" - 自定义 loading 文本
 * v-loading.spinner="dots" - 点状动画
 * v-loading.spinner="bars" - 条形动画
 * v-loading.spinner="pulse" - 脉冲动画
 * v-loading.spinner="default" - 默认动画
 * v-loading.size="small" - 小尺寸
 * v-loading.size="medium" - 中尺寸
 * v-loading.size="large" - 大尺寸
 * v-loading.color="#00ffff" - 颜色
 * v-loading.background="rgba(0, 0, 0, 0.7)" - 背景色
 * v-loading.text="加载中..." - 文本
 * v-loading.show="true" - 是否显示
 * v-loading.hide="false" - 是否隐藏
 * v-loading.destroy="true" - 是否销毁
 */

// 创建 loading 实例的容器
const loadingInstances = new Map();

/**
 * 创建 loading 实例
 * @param {HTMLElement} el - 目标元素
 * @param {Object} options - 配置选项
 * @returns {Object} loading 实例
 */
function createLoadingInstance(el, options = {}) {

  const container = document.createElement('div');
  container.className = 'v-loading-container';

  // 设置容器样式
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.right = '0';
  container.style.bottom = '0';
  container.style.zIndex = '9999';
  console.log(options);
  // 直接创建 HTML 内容，不使用 Vue 组件
  const loadingHTML = `
    <div class="loading-overlay" style="background: ${options.background || 'rgba(0, 0, 0, 0.7)'}">
      <div class="loading-container">
        <div class="loading-spinner ${'spinner-' + (options.spinner || 'default')} ${options.size || 'medium'}">
          ${getSpinnerHTML(options.spinner || 'default')}
        </div>
        ${options.text ? `<div class="loading-text" style="color: ${options.color || '#00ffff'}">${options.text}</div>` : ''}
      </div>
    </div>
  `;

  container.innerHTML = loadingHTML;


  return {
    container,
    show() {
      if (!el.contains(container)) {
        el.appendChild(container);
      }
    },
    hide() {
      if (el.contains(container)) {
        el.removeChild(container);
      }
    },
    destroy() {
      if (el.contains(container)) {
        el.removeChild(container);
      }
    }
  };
}

// 生成不同样式的 spinner HTML
function getSpinnerHTML(spinner) {
  switch (spinner) {
    case 'dots':
      return `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      `;
    case 'bars':
      return `
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      `;
    case 'pulse':
      return `<div class="pulse-circle"></div>`;
    case 'default':
    default:
      return `<div class="spinner-ring"></div>`;
  }
}

/**
 * 获取或创建 loading 实例
 * @param {HTMLElement} el - 目标元素
 * @param {Object} options - 配置选项
 * @returns {Object} loading 实例
 */
function getLoadingInstance(el, options = {}) {
  const key = el.getAttribute('data-loading-key') || 'default';
  const instanceKey = `${el}_${key}`;


  if (!loadingInstances.has(instanceKey)) {
    const instance = createLoadingInstance(el, options);
    loadingInstances.set(instanceKey, instance);
    el.setAttribute('data-loading-key', key);
  }

  return loadingInstances.get(instanceKey);
}

/**
 * 清理 loading 实例
 * @param {HTMLElement} el - 目标元素
 */
function cleanupLoadingInstance(el) {
  const key = el.getAttribute('data-loading-key') || 'default';
  const instanceKey = `${el}_${key}`;

  if (loadingInstances.has(instanceKey)) {
    const instance = loadingInstances.get(instanceKey);
    instance.destroy();
    loadingInstances.delete(instanceKey);
    el.removeAttribute('data-loading-key');
  }
}

// 指令定义
export const vLoading = {
  mounted(el, binding) {
    const { value, modifiers, arg } = binding;

    // 解析配置
    const options = {
      text: typeof value === 'object' ? value.text : '加载中...',
      background: typeof value === 'object' ? value.background : 'none',
      spinner: typeof value === 'object' ? value.spinner : 'default',
      size: typeof value === 'object' ? value.size : 'medium',
      color: typeof value === 'object' ? value.color : '#00ffff'
    };


    if (modifiers.body) {
      options.background = 'rgba(0, 0, 0, 0.8)';
      el = document.body;
    }

    // 存储配置
    el._loadingOptions = options;
    el._loadingInstance = null;

    // 如果初始值为 true，立即显示
    if (value === true || (typeof value === 'object' && value.show)) {
      showLoading(el);
    }
  },

  updated(el, binding) {
    const { value, oldValue } = binding;

    // 如果值发生变化
    if (value !== oldValue) {
      if (value === true || (typeof value === 'object' && value.show)) {
        showLoading(el);
      } else {
        hideLoading(el);
      }
    }
  },

  unmounted(el) {
    hideLoading(el);
    cleanupLoadingInstance(el);
  }
};

/**
 * 显示 loading
 * @param {HTMLElement} el - 目标元素
 */
function showLoading(el) {
  if (!el._loadingInstance) {
    el._loadingInstance = getLoadingInstance(el, el._loadingOptions);
  }
  el._loadingInstance.show();
}

/**
 * 隐藏 loading
 * @param {HTMLElement} el - 目标元素
 */
function hideLoading(el) {
  if (el._loadingInstance) {
    el._loadingInstance.hide();
  }
}

// 全局方法
export const loading = {
  /**
   * 显示 loading
   * @param {HTMLElement|String} target - 目标元素或选择器
   * @param {Object} options - 配置选项
   * @returns {Object} loading 实例
   */
  show(target, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) {
      return null;
    }

    const instance = getLoadingInstance(el, options);
    instance.show();
    return instance;
  },

  /**
   * 隐藏 loading
   * @param {HTMLElement|String} target - 目标元素或选择器
   */
  hide(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    if (el._loadingInstance) {
      el._loadingInstance.hide();
    }
  },

  /**
   * 切换 loading 状态
   * @param {HTMLElement|String} target - 目标元素或选择器
   * @param {Boolean} show - 是否显示
   * @param {Object} options - 配置选项
   */
  toggle(target, show, options = {}) {
    if (show) {
      return this.show(target, options);
    } else {
      this.hide(target);
    }
  },

  /**
   * 清理所有 loading 实例
   */
  clear() {
    loadingInstances.forEach(instance => {
      instance.destroy();
    });
    loadingInstances.clear();
  }
};

export default vLoading;
