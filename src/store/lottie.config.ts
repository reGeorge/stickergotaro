/**
 * 任务完成动画映射配置
 * 为每个约定场景配置专属的 Lottie 动画
 */

export interface LottieAnimationConfig {
  url?: string; // 远程 URL（可选）
  animationData?: any; // 本地 JSON 数据（可选）
  text: string;
  duration?: number; // 动画持续时间(ms)
  useFallback?: boolean; // 是否使用备用 CSS 动画
}

// 简单的庆祝动画 JSON 数据（撒花效果）
const CONFETTI_ANIMATION = {
  "v": "5.5.7",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 200,
  "h": 200,
  "nm": "Confetti",
  "ddd": 0,
  "assets": [],
  "layers": [{
    "ddd": 0,
    "ind": 1,
    "ty": 4,
    "nm": "Star",
    "sr": 1,
    "ks": {
      "o": { "a": 0, "k": 100 },
      "r": { "a": 1, "k": [{ "t": 0, "s": [0], "e": [360] }, { "t": 60, "s": [360] }] },
      "p": { "a": 1, "k": [{ "t": 0, "s": [100, 50], "e": [100, 150] }, { "t": 60, "s": [100, 150] }] },
      "s": { "a": 1, "k": [{ "t": 0, "s": [50, 50], "e": [100, 100] }, { "t": 30, "s": [100, 100], "e": [50, 50] }, { "t": 60, "s": [50, 50] }] }
    },
    "shapes": [{
      "ty": "sr",
      "d": 1,
      "pt": { "a": 0, "k": 5 },
      "p": { "a": 0, "k": [0, 0] },
      "r": { "a": 0, "k": 0 },
      "ir": { "a": 0, "k": 20 },
      "is": { "a": 0, "k": 0 },
      "or": { "a": 0, "k": 40 },
      "os": { "a": 0, "k": 0 }
    }, {
      "ty": "fl",
      "c": { "a": 0, "k": [1, 0.8, 0.2, 1] },
      "o": { "a": 0, "k": 100 }
    }]
  }]
};

export const LOTTIE_ANIMATIONS: Record<string, LottieAnimationConfig> = {
  // 吃饭香香 - 使用 SVG 动画
  '1': {
    useFallback: true,
    text: '吃饭真香！太棒了！',
    duration: 3000
  },
  
  // 洗刷刷达人
  '2': {
    useFallback: true,
    text: '洗得真干净！',
    duration: 3000
  },
  
  // 玩具回新家
  '3': {
    useFallback: true,
    text: '玩具归位，好习惯！',
    duration: 3000
  },
  
  // 上学不迟到
  '4': {
    useFallback: true,
    text: '准时上学，超棒！',
    duration: 3000
  },
  
  // 准时梦游记
  '5': {
    useFallback: true,
    text: '准时睡觉，晚安！',
    duration: 3000
  },
  
  // 默认动画（获得磁贴）
  'default': {
    useFallback: true,
    text: '挑战成功！',
    duration: 3000
  },
  
  // 全垒打动画（第5个任务完成）
  'homeRun': {
    useFallback: true,
    text: '🎉 全垒打！五项全能达成！',
    duration: 4000
  },
  
  // 兑换成功动画
  'redeem': {
    useFallback: true,
    text: '🎁 兑换成功！梦想成真！',
    duration: 3000
  }
};

/**
 * 获取任务对应的动画配置
 */
export function getTaskAnimation(taskId: string): LottieAnimationConfig {
  return LOTTIE_ANIMATIONS[taskId] || LOTTIE_ANIMATIONS['default'];
}

/**
 * 获取全垒打动画配置
 */
export function getHomeRunAnimation(): LottieAnimationConfig {
  return LOTTIE_ANIMATIONS['homeRun'];
}

/**
 * 获取兑换成功动画配置
 */
export function getRedeemAnimation(): LottieAnimationConfig {
  return LOTTIE_ANIMATIONS['redeem'];
}
