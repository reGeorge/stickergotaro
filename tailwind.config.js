
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 这里配置需要扫描的文件路径
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // 小程序不需要 preflight，因为没有 DOM
    preflight: false
  }
}
