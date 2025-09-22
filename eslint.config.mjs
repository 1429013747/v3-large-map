// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'antfu/if-newline': 'off',
    'style/comma-dangle': 'off',
    'comma-dangle': ['error', 'never'],
    'vue/component-tags-order': ['error', {
      order: ['script', 'template', 'style']
    }],
    // ✅ 允许使用 console
    'no-console': 'off'
  }
})
