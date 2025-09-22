<!--
  全局Loading组件
  支持多种显示模式和样式
-->
<script setup>
import { globalLoading } from '@/components/common/GlobalLoading/useGlobalLoading'
import { computed } from 'vue'

defineOptions({
  name: 'GlobalLoading'
})

// 使用全局loading状态
const { globalLoadingState } = globalLoading

// 计算loading样式类
const loadingClass = computed(() => {
  return {
    'global-loading': true,
    'global-loading--visible': globalLoadingState.isLoading,
    [`global-loading--${globalLoadingState.type}`]: true
  }
})

// 计算当前操作数量
const operationCount = computed(() => {
  return globalLoadingState.loadingOperations.size
})
</script>

<template>
  <Transition name="loading-fade">
    <div v-if="globalLoadingState.isLoading" :class="loadingClass">
      <!-- 遮罩层 -->
      <div class="loading-overlay" />

      <!-- Loading内容 -->
      <div class="loading-content">
        <!-- 加载动画 -->
        <div class="loading-spinner">
          <div class="spinner-ring">
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>

        <!-- 加载消息 -->
        <div class="loading-message">
          {{ globalLoadingState.message }}
        </div>

        <!-- 操作计数（开发模式显示） -->
        <div v-if="operationCount > 1" class="loading-count">
          {{ operationCount }} 个操作进行中
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &--visible {
    pointer-events: auto;
  }

  // 默认模式：全屏遮罩
  &--default,
  &--overlay {
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 25, 35, 0.8);
      backdrop-filter: blur(5px);
    }
  }

  // 内联模式：无遮罩
  &--inline {
    position: relative;
    background: transparent;
    pointer-events: none;

    .loading-overlay {
      display: none;
    }
  }
}

.loading-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(18, 28, 43, 0.95) 0%, rgba(15, 25, 35, 0.9) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(0, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-width: 200px;
  text-align: center;
}

.loading-spinner {
  position: relative;

  .spinner-ring {
    display: inline-block;
    position: relative;
    width: 48px;
    height: 48px;

    div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 40px;
      height: 40px;
      margin: 4px;
      border: 3px solid transparent;
      border-top-color: #00FFFF;
      border-radius: 50%;
      animation: spinner-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

      &:nth-child(1) {
        animation-delay: -0.45s;
        border-top-color: #00FFFF;
      }

      &:nth-child(2) {
        animation-delay: -0.3s;
        border-top-color: rgba(0, 255, 255, 0.7);
      }

      &:nth-child(3) {
        animation-delay: -0.15s;
        border-top-color: rgba(0, 255, 255, 0.5);
      }

      &:nth-child(4) {
        border-top-color: rgba(0, 255, 255, 0.3);
      }
    }
  }
}

.loading-message {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.loading-count {
  color: rgba(0, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 400;
  opacity: 0.8;
}

// 动画定义
@keyframes spinner-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 过渡动画
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: all 0.3s ease;
}

.loading-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.loading-fade-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

.loading-fade-enter-to,
.loading-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

// 响应式设计
@media (max-width: 768px) {
  .loading-content {
    padding: 24px;
    min-width: 160px;
  }

  .loading-message {
    font-size: 14px;
  }

  .loading-spinner .spinner-ring {
    width: 40px;
    height: 40px;

    div {
      width: 32px;
      height: 32px;
      margin: 4px;
      border-width: 2px;
    }
  }
}
</style>
