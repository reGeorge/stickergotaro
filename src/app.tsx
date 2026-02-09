
import { PropsWithChildren } from 'react'
import { useDidShow } from '@tarojs/taro'
import { useStore } from './store/useStore'
import './app.css' // 假设这里引入了 @tailwind 指令

function App({ children }: PropsWithChildren<any>) {
  const checkDailyReset = useStore(state => state.checkDailyReset)

  useDidShow(() => {
    // 每次切回小程序前台时检查是否需要重置任务
    checkDailyReset()
  })

  return children
}

export default App
