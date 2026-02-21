/** @type {import('tailwindcss').Config} */
module.exports = {
  // 覆盖 src 目录下所有 React/Taro 文件
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  // 确保 Tailwind 的 class 优先级高于 TDesign 默认样式
  important: true,
  theme: {
    extend: {
      colors: {
        // --- 核心梦幻渐变色系 ---
        'brand': {
          'primary': '#6366f1', // Indigo 500
          'secondary': '#a855f7', // Purple 500
          'accent': '#ec4899', // Pink 500
        },
        // --- 背景色优化：增加色彩倾向而非纯灰 ---
        'bg': {
          'main': '#F8FAFF',   // 极淡蓝紫（背景）
          'card': 'rgba(255, 255, 255, 0.8)', // 玻璃拟态半透明
          'blue': '#E0E7FF',
          'pink': '#FCE7F3',
          'yellow': '#FEF3C7',
          'green': '#DCFCE7',
        },
        // --- 文字颜色 ---
        'text': {
          'main': '#1E293B',   // 深蓝灰（更有质感）
          'sub': '#64748B',    // 次要文字
        }
      },
      // --- 强制圆角标准 (40rpx) ---
      borderRadius: {
        '3xl': '40rpx',
        '2xl': '32rpx',
      },
      // --- 磁贴专属发光阴影 ---
      boxShadow: {
        'glass': '0 8rpx 32rpx 0 rgba(31, 38, 135, 0.07)',
        'glow-purple': '0 0 20rpx rgba(168, 85, 247, 0.4)',
        'glow-pink': '0 0 20rpx rgba(236, 72, 153, 0.3)',
      },
      // --- 动画节奏 ---
      transitionDuration: {
        '2000': '2000ms',
      },
      // --- 点击反馈 ---
      scale: {
        '95': '0.95',
      },
      // --- 自定义动画关键帧 ---
      animation: {
        'pop-in': 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
        'burst-out': 'burstOut 0.8s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
        'suck-in': 'suckIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'gift-open': 'giftOpen 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.3s',
      },
      keyframes: {
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        burstOut: {
          '0%': { opacity: '1', transform: 'scale(0)' },
          '100%': { opacity: '0', transform: 'scale(2)' },
        },
        suckIn: {
          '0%': { opacity: '1', transform: 'translate(0, 0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(var(--tx), var(--ty)) scale(0.2)' },
        },
        giftOpen: {
          '0%': { transform: 'rotate(0)' },
          '100%': { transform: 'rotate(-20deg) translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    // 微信小程序环境必须禁用 preflight (CSS 重置)
    preflight: false,
    // 禁用一些小程序不支持的高级选择器
    space: false,
    divideColor: false,
    divideWidth: false,
    divideOpacity: false,
  }
}