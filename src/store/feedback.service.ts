import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { soundService } from '../utils/sound'
import { getTaskAnimation, getHomeRunAnimation, getRedeemAnimation, LottieAnimationConfig } from './lottie.config'

export interface FeedbackState {
  isVisible: boolean
  animationConfig: LottieAnimationConfig | null
  isHomeRun: boolean
  
  // Actions
  showFeedback: (taskId: string, isHomeRun?: boolean) => void
  showRedeemFeedback: () => void
  hideFeedback: () => void
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  isVisible: false,
  animationConfig: null,
  isHomeRun: false,
  
  showFeedback: (taskId, isHomeRun = false) => {
    const config = isHomeRun 
      ? getHomeRunAnimation() 
      : getTaskAnimation(taskId)
    
    set({
      isVisible: true,
      animationConfig: config,
      isHomeRun
    })
  },
  
  showRedeemFeedback: () => {
    const config = getRedeemAnimation()
    
    set({
      isVisible: true,
      animationConfig: config,
      isHomeRun: false
    })
  },
  
  hideFeedback: () => {
    set({
      isVisible: false,
      animationConfig: null,
      isHomeRun: false
    })
  }
}))

/**
 * 反馈服务 - 管理动画、震动等多模态反馈
 */
export class FeedbackService {
  /**
   * 触发任务完成反馈
   */
  static showTaskComplete(taskId: string, isHomeRun: boolean = false) {
    // 触发震动
    Taro.vibrateShort({ type: 'medium' })
    
    // 显示动画
    useFeedbackStore.getState().showFeedback(taskId, isHomeRun)
  }
  
  /**
   * 触发兑换成功反馈
   */
  static showRedeemSuccess() {
    // 触发震动
    Taro.vibrateShort({ type: 'medium' })
    soundService.playFanfare()
    
    // 显示动画
    useFeedbackStore.getState().showRedeemFeedback()
  }
  
  /**
   * 关闭反馈
   */
  static hideFeedback() {
    useFeedbackStore.getState().hideFeedback()
  }
}
