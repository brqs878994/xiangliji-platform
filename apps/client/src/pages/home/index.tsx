import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './home.scss';

export default function HomePage() {
  return (
    <View className='home-page'>
      <View className='home-header'>
        <View className='brand'>
          <Text className='brand-symbol'>乡</Text>
          <View>
            <Text className='brand-name'>乡里集</Text>
            <Text className='brand-subtitle'>县域生活交换站</Text>
          </View>
        </View>
        <Text className='location'>城关镇</Text>
      </View>

      <View className='hero'>
        <View className='hero-copy'>
          <Text className='eyebrow'>城关镇 · 本镇信号在线</Text>
          <Text className='hero-title'>今天，镇上有什么新消息？</Text>
          <Text className='hero-description'>查一查本镇信息，也可以让 AI 帮你整理一条发布草稿。</Text>
          <View className='hero-actions'>
            <View className='primary-action' onClick={() => Taro.navigateTo({ url: '/pages/ai/index' })}>
              <Text>问问 AI</Text>
            </View>
            <View className='secondary-action' onClick={() => Taro.showToast({ title: '发布入口即将接入', icon: 'none' })}>
              <Text>发布信息</Text>
            </View>
          </View>
        </View>
        <View className='pulse'>
          <Text className='pulse-label'>本镇脉搏</Text>
          <Text className='pulse-number'>28</Text>
          <Text className='pulse-caption'>条新信息</Text>
          <View className='pulse-bars'>
            {[12, 22, 18, 30, 24, 38, 28, 48, 34, 44].map((height, index) => (
              <View key={index} className='pulse-bar' style={{ height: height + 'px' }} />
            ))}
          </View>
        </View>
      </View>

      <View className='trust-strip'>
        <Text>平台只做信息交流，不参与交易、不担保资金</Text>
      </View>

      <View className='section-heading'>
        <Text className='section-kicker'>按你要办的事</Text>
        <Text className='section-title'>现在想做什么？</Text>
      </View>
      <View className='category-grid'>
        {[
          ['助农供求', '卖货 · 找收'],
          ['求职招工', '找活 · 找人'],
          ['有偿任务', '跑腿 · 代办'],
          ['二手市场', '闲置 · 农机'],
        ].map(([title, subtitle]) => (
          <View key={title} className='category-card' onClick={() => Taro.navigateTo({ url: '/pages/ai/index' })}>
            <Text className='category-title'>{title}</Text>
            <Text className='category-subtitle'>{subtitle}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

