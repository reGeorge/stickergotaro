import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import lottie from 'lottie-miniprogram'
import { useFeedbackStore } from '../store/feedback.service'
import { View as TaroView, Text as TaroText, Canvas as TaroCanvas, Image as TaroImage } from '@tarojs/components'

const View = TaroView as any
const Text = TaroText as any
const Canvas = TaroCanvas as any
const Image = TaroImage as any

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
            {/* 简单的庆祝动画效果 */}
            <View className="relative">
              {/* 中心星星 */}
              <View className="text-8xl animate-bounce">⭐</View>
              
              {/* 环绕的小星星 */}
              <View className="absolute -top-8 -left-8 text-4xl animate-ping">✨</View>
              <View className="absolute -top-8 -right-8 text-4xl animate-ping" style={{ animationDelay: '0.2s' }}>✨</View>
              <View className="absolute -bottom-8 -left-8 text-4xl animate-ping" style={{ animationDelay: '0.4s' }}>✨</View>
              <View className="absolute -bottom-8 -right-8 text-4xl animate-ping" style={{ animationDelay: '0.6s' }}>✨</View>
              
              {/* 彩带 */}
              <View className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce">🎉</View>
              <View className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</View>
            </View>
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
