module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  env: {
    es6: true,
    node: true
  },
  rules: {
    'curly': 'warn',
    'eqeqeq': 'warn',
    'quote-props': 0,
    'space-before-function-paren': 0,
    'object-shorthand': 'off'
  }
}
