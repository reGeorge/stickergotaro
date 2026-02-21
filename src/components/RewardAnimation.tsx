import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import lottie from 'lottie-miniprogram'
import { useFeedbackStore } from '../store/feedback.service'
import { View as TaroView, Text as TaroText, Canvas as TaroCanvas } from '@tarojs/components'

const View = TaroView as any
const Text = TaroText as any
const Canvas = TaroCanvas as any

export default function RewardAnimation() {
  const { isVisible, animationConfig, isHomeRun, hideFeedback } = useFeedbackStore()
  const canvasId = useRef(`lottie-canvas-${Date.now()}`)
  const animationRef = useRef<any>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (isVisible && animationConfig) {
      setLoadError(false)
      
      // 如果使用备用动画，不初始化 Lottie
      if (animationConfig.useFallback) {
        // 自动关闭
        const timer = setTimeout(() => {
          hideFeedback()
        }, animationConfig.duration || 3000)
        return () => clearTimeout(timer)
      }
      
      // 延迟一帧等待 Canvas 渲染
      setTimeout(() => {
        initAnimation()
      }, 100)
    }
    
    return () => {
      // 销毁动画
      if (animationRef.current) {
        animationRef.current.destroy()
        animationRef.current = null
      }
    }
  }, [isVisible, animationConfig])

  const initAnimation = () => {
    if (!animationConfig) return

    const query = Taro.createSelectorQuery()
    query
      .select(`#${canvasId.current}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) {
          console.error('Canvas not found')
          setLoadError(true)
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        // 设置 canvas 尺寸
        const dpr = Taro.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        // 准备动画数据
        const animationOptions: any = {
          canvas: canvas,
          autoplay: true,
          loop: false,
          rendererSettings: {
            context: ctx,
          },
        }

        // 使用本地数据或远程 URL
        if (animationConfig.animationData) {
          animationOptions.animationData = animationConfig.animationData
        } else if (animationConfig.url) {
          animationOptions.path = animationConfig.url
        }

        // 加载 Lottie 动画
        try {
          lottie.loadAnimation(animationOptions, (animation) => {
            animationRef.current = animation

            // 监听动画完成事件
            animation.addEventListener('complete', () => {
              // 延迟关闭，让用户有时间看到完整动画
              setTimeout(() => {
                hideFeedback()
                // 销毁动画实例
                animation.destroy()
                animationRef.current = null
              }, 500)
            })

            // 监听错误事件
            animation.addEventListener('error', () => {
              setLoadError(true)
            })
          })
        } catch (error) {
          console.error('Lottie load error:', error)
          setLoadError(true)
        }
      })
  }

  if (!isVisible || !animationConfig) return null

  return (
    <View 
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md"
      onClick={hideFeedback}
    >
      {/* 背景遮罩 */}
      <View className="absolute inset-0 bg-gradient-to-br from-pink-200/30 via-purple-200/30 to-blue-200/30" />
      
      {/* 动画容器 */}
      <View className="relative flex flex-col items-center">
        {/* 备用 CSS 动画 或 Lottie Canvas */}
        {animationConfig.useFallback || loadError ? (
          <View className="w-80 h-80 flex items-center justify-center">
            {/* 根据动画类型选择不同的动画效果 */}
            {animationConfig.text.includes('兑换') ? (
              // 兑换奖励动画 - 礼物盒 + 磁贴吸入效果
              <View className="relative w-64 h-64">
                {/* 背景旋转光芒 */}
                <View className="absolute inset-0 flex items-center justify-center animate-spin-slow opacity-20">
                  <View className="w-64 h-64 rounded-full bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200"></View>
                </View>
                
                {/* 核心礼物盒 - 使用多个弹跳效果 */}
                <View className="absolute inset-0 flex items-center justify-center animate-pop-in z-10">
                  <View className="text-9xl animate-bounce drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]">🎁</View>
                </View>
                
                {/* 被吸入的磁贴粒子 */}
                <View className="absolute top-8 left-12 text-4xl animate-suck-in opacity-80" 
                      style={{'--tx': '50px', '--ty': '90px'} as any}>🧲</View>
                <View className="absolute top-12 right-12 text-4xl animate-suck-in opacity-80" 
                      style={{'--tx': '-50px', '--ty': '80px', animationDelay: '0.2s'} as any}>🧲</View>
                <View className="absolute top-0 left-1/2 transform -translate-x-1/2 text-4xl animate-suck-in opacity-80" 
                      style={{'--tx': '0px', '--ty': '100px', animationDelay: '0.4s'} as any}>🧲</View>
                
                {/* 彩带装饰 */}
                <View className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce">🎊</View>
                <View className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</View>
              </View>
            ) : isHomeRun ? (
              // 全垒打特殊动画 - 更强烈的庆祝效果
              <View className="relative w-64 h-64">
                {/* 背景光环炸裂 */}
                <View className="absolute inset-0 flex items-center justify-center animate-burst-out opacity-30">
                  <View className="w-64 h-64 rounded-full bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent"></View>
                </View>
                
                {/* 中心大奖杯 */}
                <View className="absolute inset-0 flex items-center justify-center animate-pop-in z-10">
                  <View className="text-9xl drop-shadow-[0_20px_40px_rgba(168,85,247,0.5)]">🏆</View>
                </View>
                
                {/* 环绕的星星 */}
                <View className="absolute -top-12 -left-12 text-5xl animate-ping">✨</View>
                <View className="absolute -top-12 -right-12 text-5xl animate-ping" style={{ animationDelay: '0.2s' }}>⭐</View>
                <View className="absolute -bottom-12 -left-12 text-5xl animate-ping" style={{ animationDelay: '0.4s' }}>🌟</View>
                <View className="absolute -bottom-12 -right-12 text-5xl animate-ping" style={{ animationDelay: '0.6s' }}>💫</View>
                
                {/* 彩带和烟花 */}
                <View className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce">🎉</View>
                <View className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</View>
                <View className="absolute top-0 -left-16 text-3xl animate-float" style={{ animationDelay: '0.5s' }}>🎆</View>
                <View className="absolute top-0 -right-16 text-3xl animate-float" style={{ animationDelay: '0.7s' }}>🎇</View>
              </View>
            ) : (
              // 普通任务完成动画 - 磁贴弹出效果
              <View className="relative w-64 h-64">
                {/* 背景光环炸裂 */}
                <View className="absolute inset-0 flex items-center justify-center animate-burst-out opacity-40">
                  <View className="w-48 h-48 rounded-full bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-accent"></View>
                </View>
                
                {/* 核心磁贴图标 */}
                <View className="absolute inset-0 flex items-center justify-center animate-pop-in z-10">
                  <View className="animate-float">
                    <View className="text-9xl drop-shadow-[0_20px_40px_rgba(168,85,247,0.5)]">🧲</View>
                  </View>
                </View>
                
                {/* 周围炸裂的小星星 */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <View 
                    key={i} 
                    className="absolute top-1/2 left-1/2 text-3xl animate-burst-out" 
                    style={{ 
                      transform: `rotate(${angle}deg) translate(80px) translate(-50%, -50%)`,
                      animationDelay: `${i * 0.05}s`
                    }}
                  >⭐</View>
                ))}
                
                {/* 额外装饰 */}
                <View className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">✨</View>
                <View className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>💫</View>
              </View>
            )}
          </View>
        ) : (
          <Canvas
            id={canvasId.current}
            type="2d"
            className="w-80 h-80"
            style={{ width: '320px', height: '320px' }}
          />
        )}
        
        {/* 成功文案 */}
        <View className="mt-6 px-8 py-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50">
          <Text 
            className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent ${
              isHomeRun ? 'text-3xl' : ''
            }`}
          >
            {animationConfig.text}
          </Text>
          
          {/* 额外提示 */}
          {isHomeRun && (
            <Text className="block text-center text-sm text-slate-600 mt-2">
              🌟 额外获得 5 个磁贴奖励！
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
