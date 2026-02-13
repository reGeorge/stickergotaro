
const { UnifiedWebpackPluginV5 } = require('weapp-tailwindcss/webpack')
const path = require('path')

const config = {
  projectName: 'sticker-go-taro',
  date: '2024-02-22',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {
  },
  copy: {
    patterns: [
      { from: 'src/assets', to: 'dist/assets', ignore: ['*.tsx', '*.ts'] }
    ],
    options: {
    }
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false // 禁用缓存，避免 Tailwind 类名变动不生效
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {
        }
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      },
      // 关键：显式配置 tailwindcss 插件
      tailwindcss: {
        enable: true,
        config: {
          // 留空则自动读取根目录 tailwind.config.js
        }
      },
      autoprefixer: {
        enable: true,
        config: {}
      }
    },
    webpackChain(chain) {
      // 集成 weapp-tailwindcss
      chain.merge({
        plugin: {
          install: {
            plugin: UnifiedWebpackPluginV5,
            args: [{
              appType: 'taro',
              // 开启 rem 转 rpx，增强兼容性
              rem2rpx: true
            }]
          }
        }
      })
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {
        }
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
