import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => {
    // 获取存储的主题或系统偏好
    const storedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    return {
      isDark: storedTheme ? storedTheme === 'dark' : systemPrefersDark,
      themeMode: storedTheme || 'system', // 'light', 'dark', 'system'
      systemMediaQuery: null
    }
  },

  getters: {
    theme: state => state.isDark ? 'dark' : 'light',
    isSystemTheme: state => state.themeMode === 'system',
    currentThemeMode: state => state.themeMode
  },

  actions: {
    // 根据传入的主题值设置主题
    setTheme(theme) {
      if (typeof theme === 'string') {
        // 支持传入 'dark'/'light'/'system' 字符串
        if (theme === 'system') {
          this.themeMode = 'system'
          localStorage.removeItem('theme')
          this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        } else if (theme === 'dark' || theme === 'light') {
          this.themeMode = theme
          this.isDark = theme === 'dark'
          localStorage.setItem('theme', theme)
        } else {
          console.error('主题设置失败: 参数必须是 "dark"、"light" 或 "system"')
          return false
        }
      }
      else if (typeof theme === 'boolean') {
        // 支持传入布尔值
        this.themeMode = theme ? 'dark' : 'light'
        this.isDark = theme
        localStorage.setItem('theme', this.theme)
      }
      else {
        console.error('主题设置失败: 参数必须是 "dark"、"light"、"system" 或布尔值')
        return false
      }

      this.applyTheme()
      return true
    },

    toggleTheme() {
      this.isDark = !this.isDark
      this.themeMode = this.isDark ? 'dark' : 'light'
      localStorage.setItem('theme', this.theme)
      this.applyTheme()
    },

    initTheme(defaultTheme) {
      // 如果提供了默认主题且本地存储中没有主题设置，则使用默认主题
      if (defaultTheme && !localStorage.getItem('theme')) {
        this.setTheme(defaultTheme)
      }
      else {
        this.applyTheme()
      }

      // 监听系统主题变化
      this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemMediaQuery.addEventListener('change', (e) => {
        if (this.themeMode === 'system') {
          this.isDark = e.matches
          this.applyTheme()
        }
      })
    },

    applyTheme() {
      // 设置HTML属性
      document.documentElement.setAttribute('data-theme', this.theme)

      // 为body添加暗黑模式类名，兼容Ant Design Vue的暗黑模式
      if (this.isDark) {
        document.body.classList.add('dark')
        document.body.setAttribute('data-theme', 'dark')
        // 设置Ant Design的暗黑模式
        document.documentElement.classList.add('dark')
      }
      else {
        document.body.classList.remove('dark')
        document.body.setAttribute('data-theme', 'light')
        // 移除Ant Design的暗黑模式
        document.documentElement.classList.remove('dark')
      }
    }
  },

  persist: true
})
