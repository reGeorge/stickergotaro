module.exports = {
  pages: [
    'pages/home/index',
    'pages/shop/index',
    'pages/stats/index',
    'pages/moments/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#eff6ff',
    navigationBarTitleText: '磁贴大作战',
    navigationBarTextStyle: 'black',
    backgroundColor: '#eff6ff'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#4f46e5',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: './assets/icons/home.png',
        selectedIconPath: './assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/shop/index',
        text: '梦想屋',
        iconPath: './assets/icons/shop.png',
        selectedIconPath: './assets/icons/shop-active.png'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计',
        iconPath: './assets/icons/chart.png',
        selectedIconPath: './assets/icons/chart-active.png'
      },
      {
        pagePath: 'pages/moments/index',
        text: '美好',
        iconPath: './assets/icons/camera.png',
        selectedIconPath: './assets/icons/camera-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/icons/user.png',
        selectedIconPath: './assets/icons/user-active.png'
      }
    ]
  }
}
