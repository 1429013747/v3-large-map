<template>
  <div class="theme-switch">
    <!-- 主题切换按钮 -->
    <div class="theme-toggle-btn" @click="toggleSelector" :title="themeStore.isDark ? '切换到浅色主题' : '切换到深色主题'">
      <div class="theme-icon">
        <!-- 太阳图标 - 浅色主题 -->
        <svg v-if="!themeStore.isDark" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <!-- 月亮图标 - 深色主题 -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="theme-text">{{ themeStore.isDark ? '深色' : '浅色' }}</span>
    </div>

    <!-- 主题选择下拉菜单 -->
    <div class="theme-selector" v-show="showSelector" @click.stop>
      <div class="theme-options">
        <div 
          class="theme-option" 
          :class="{ active: !themeStore.isDark }"
          @click="setTheme('light')"
        >
          <div class="theme-preview light">
            <div class="preview-sun">☀️</div>
          </div>
          <span>浅色主题</span>
        </div>
        <div 
          class="theme-option" 
          :class="{ active: themeStore.isDark }"
          @click="setTheme('dark')"
        >
          <div class="theme-preview dark">
            <div class="preview-moon">🌙</div>
          </div>
          <span>深色主题</span>
        </div>
        <div 
          class="theme-option" 
          :class="{ active: isSystemTheme }"
          @click="setSystemTheme"
        >
          <div class="theme-preview system">
            <div class="preview-system">🖥️</div>
          </div>
          <span>跟随系统</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const showSelector = ref(false)

// 检查是否为系统主题
const isSystemTheme = computed(() => {
  return !localStorage.getItem('theme')
})

// 切换主题
const toggleTheme = () => {
  themeStore.toggleTheme()
}

// 设置指定主题
const setTheme = (theme) => {
  themeStore.setTheme(theme)
  showSelector.value = false
}

// 设置为跟随系统主题
const setSystemTheme = () => {
  localStorage.removeItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  themeStore.setTheme(systemPrefersDark ? 'dark' : 'light')
  showSelector.value = false
}

// 点击外部关闭选择器
const handleClickOutside = (event) => {
  if (!event.target.closest('.theme-switch')) {
    showSelector.value = false
  }
}

// 点击切换按钮显示/隐藏选择器
const toggleSelector = () => {
  showSelector.value = !showSelector.value
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.theme-switch {
  position: relative;
  display: inline-block;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  user-select: none;

  &:hover {
    background: rgba(0, 255, 255, 0.1);
    border-color: rgba(0, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 255, 255, 0.2);
  }

  .theme-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  .theme-text {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
  }
}

.theme-selector {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: linear-gradient(135deg, rgba(15, 25, 35, 0.95) 0%, rgba(25, 35, 45, 0.95) 100%);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  z-index: 1000;
  min-width: 160px;
  animation: themeSelectorFadeIn 0.3s ease-out;

  .theme-options {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      background: rgba(0, 255, 255, 0.1);
      color: #ffffff;
    }

    &.active {
      background: rgba(0, 255, 255, 0.2);
      color: #00ffff;
      border: 1px solid rgba(0, 255, 255, 0.4);
    }

    .theme-preview {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.3s ease;

      &.light {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #333;
      }

      &.dark {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        color: #fff;
      }

      &.system {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
      }
    }

    span {
      font-size: 14px;
      font-weight: 500;
    }
  }
}

@keyframes themeSelectorFadeIn {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 深色主题下的样式调整
:global(.dark) .theme-toggle-btn {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(0, 255, 255, 0.4);

  &:hover {
    background: rgba(0, 255, 255, 0.15);
    border-color: rgba(0, 255, 255, 0.6);
  }
}

:global(.dark) .theme-selector {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
  border-color: rgba(0, 255, 255, 0.4);
}
</style>
