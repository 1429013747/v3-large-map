// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'antfu/if-newline': 'off',
    'style/comma-dangle': 'off',
    'comma-dangle': 'off',
    'vue/component-tags-order': ['error', {
      order: ['script', 'template', 'style']
    }],
    // ✅ 允许使用 console
    'no-console': 'off',
    'style/semi': 'off',
    'style/quotes': 'off',
    'prefer-regex-literals': 'off',
    'node/handle-callback-err': 'off',
    'no-unused-expressions': 'off',
    'eqeqeq': 'off',
    'style/indent': 'off',
    'style/brace-style': 'off',
    'import/no-duplicates': 'off',
    'perfectionist/sort-imports': 'off',
    'style/no-trailing-spaces': 'off',
    'no-restricted-globals': 'off',
    'regexp/no-super-linear-backtracking': 'off',
    'no-useless-call': 'off',
    'node/prefer-global/process': 'off',
    'no-throw-literal': 'off',
    'no-var': 'off',
    'no-undef': 'off',
    'block-scoped-var': 'off',
    'vars-on-top': 'off',
    'no-use-before-define': 'off',
    'new-cap': 'off',
    'no-cond-assign': 'off',
    'style/indent-binary-ops': 'off',
    'prefer-promise-reject-errors': 'off',
    'prefer-rest-params': 'off',
    'no-sequences': 'off',
    'style/operator-linebreak': 'off',
    'style/arrow-parens': 'off',
    'vue/custom-event-name-casing': 'off',
    'unused-imports/no-unused-vars': ['off'],
    'no-unused-vars': ['off'],
  },
  ignores: ['dist/**', 'node_modules/**', 'src/utils/autoScale.js', 'public/**']
})
