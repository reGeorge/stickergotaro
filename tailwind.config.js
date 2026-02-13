
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 确保涵盖所有源文件
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
  ],
  // 关键：确保 Tailwind 样式优先级高于默认样式
  important: true,
  theme: {
    extend: {
      colors: {
        'bg-blue': '#eff6ff',
        'bg-pink': '#fff5f7',
        'bg-gray': '#f7f8fa',
      },
      fontSize: {
        'xxs': '10rpx',
      },
      boxShadow: {
        'glow': '0 0 15rpx rgba(253, 224, 71, 0.5)',
      },
      backdropBlur: {
        'xs': '1rpx',
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // 微信小程序必须禁用 preflight (基础样式重置)，否则会造成样式冲突或报错
    preflight: false
  }
}
