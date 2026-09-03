import { Image, Text, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import './home.scss';
import marketBasket from '../../assets/market-basket.jpg';
import { getPosts } from '../../services/platform';

const categories = [
  { title: '助农供求', subtitle: '卖货 · 找收', icon: '穗', tone: 'green' },
  { title: '求职招工', subtitle: '找活 · 找人', icon: '工', tone: 'orange' },
  { title: '有偿任务', subtitle: '跑腿 · 代办', icon: '帮', tone: 'yellow' },
  { title: '二手市场', subtitle: '闲置 · 农机', icon: '换', tone: 'ink' },
  { title: '约局互动', subtitle: '球局 · 拼车', icon: '局', tone: 'teal' },
];

const initialPosts = [
  { type: '助农供求', age: '同镇 · 12 分钟前', title: '收土鸡蛋，长期要货', summary: '每周稳定收 200 斤，个头均匀，城关镇可上门看货。', price: '1.20', unit: '元/斤', response: '2 人已联系', label: '收', tone: 'market', image: marketBasket },
  { type: '二手市场', age: '邻村 · 1 小时前', title: '旧打谷机，正常使用', summary: '有使用痕迹，配件齐全，王家镇自提。', price: '1200', unit: '元 · 可议价', response: '1 人已收藏', label: '卖', tone: 'tools' },
  { type: '日结零工', age: '城关镇 · 2 小时前', title: '下午装车，缺 5 人', summary: '今天 14:00 集合，做完结算，管一顿午饭。', price: '260', unit: '元/天', response: '还缺 3 人', label: '招', tone: 'job' },
];

function go(url: string) {
  Taro.navigateTo({ url });
}

export default function HomePage() {
  const [textMode, setTextMode] = useState(false);
  const [query, setQuery] = useState('');
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState('');
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    void getPosts({ townCode: 'chengguan' }).then((items) => {
      setPosts(items.slice(0, 3).map((post, index) => ({
        type: post.category,
        age: `${post.townName} · ${index === 0 ? '刚刚' : `${index + 1} 小时前`}`,
        title: post.title,
        summary: post.summary,
        price: index === 0 ? '1.20' : index === 1 ? '260' : '1200',
        unit: index === 0 ? '元/斤' : index === 1 ? '元/天' : '元 · 可议价',
        response: post.responseLabel || '可联系',
        label: index === 0 ? '收' : index === 1 ? '招' : '卖',
        tone: index === 0 ? 'market' : index === 1 ? 'job' : 'tools',
        image: index === 0 ? marketBasket : undefined,
      })));
    }).catch(() => setPosts(initialPosts));
  }, []);

  function showNotice(message: string) {
    setNotice(message);
    Taro.showToast({ title: message, icon: 'none' });
  }

  function submitSearch() {
    if (!query.trim()) {
      showNotice('先说说你想找什么');
      return;
    }
    go(`/pages/ai/index?query=${encodeURIComponent(query.trim())}`);
  }

  return (
    <View className='app-shell'>
      <View className='side-rail'>
        <View className='brand-mark'><Text className='brand-symbol'>乡</Text><View><Text className='brand-name'>乡里集</Text><Text className='brand-subtitle'>县域生活交换站</Text></View></View>
        <View className='rail-location'><Text className='icon'>⌖</Text><Text>城关镇</Text><Text className='icon'>⌄</Text></View>
        <View className='rail-nav'>
          <View className='rail-item active'><Text className='icon'>⌂</Text><Text>首页</Text></View>
          <View className='rail-item' onClick={() => go('/pages/explore/index')}><Text className='icon'>◌</Text><Text>逛一逛</Text></View>
          <View className='rail-item' onClick={() => showNotice('消息中心正在接入')}><Text className='icon'>◍</Text><Text>消息</Text><Text className='badge'>2</Text></View>
          <View className='rail-item' onClick={() => showNotice('个人中心正在接入')}><Text className='icon'>◉</Text><Text>我的</Text></View>
          <View className='rail-item' onClick={() => go('/pages/admin/index')}><Text className='icon'>⚙</Text><Text>运营台</Text></View>
        </View>
        <View className='rail-footer'><View className='rail-help' onClick={() => showNotice('不交押金，不扫陌生码')}><Text className='icon'>♢</Text><Text>防骗指南</Text></View><View className='rail-user'><Text className='avatar'>李</Text><View><Text className='user-name'>李叔</Text><Text className='user-sub'>已认证发布者</Text></View></View></View>
      </View>

      <View className='main-content'>
        <View className='topbar'><View className='mobile-brand'><Text className='brand-symbol'>乡</Text><Text>乡里集</Text></View><View className='topbar-copy'><Text className='eyebrow'>城关镇 · 星期四 9月3日</Text><Text className='page-title'>今天，镇上有什么新消息？</Text></View><View className='topbar-actions'><View className='top-publish-button' onClick={() => go('/pages/publish/index')}><Text className='publish-plus'>＋</Text><Text>发布信息</Text></View><Text className='icon-button'>♧</Text><Text className='avatar small'>李</Text></View></View>

        <View className='hero-grid'>
          <View className={`voice-card ${textMode ? 'typing-open' : ''}`}>
            <View className='voice-card-top'><View className='live-label'><Text className='live-dot' />本镇信号在线</View><View className='voice-mode-actions'><Text className='voice-hint'>说一句，帮你找或发</Text><View className='mode-toggle' onClick={() => setTextMode(!textMode)}><Text className='icon'>▤</Text><Text>{textMode ? '切回语音' : '改用文字输入'}</Text></View></View></View>
            {!textMode ? <View className='voice-main'><View className='waveform'>{[16,28,20,38,24,48,32,58,30,42,22,52,28,40,18].map((h, i) => <Text key={i} className='wave-bar' style={{ height: `${h}px` }} />)}</View><View className={`record-button ${recording ? 'recording' : ''}`} onTouchStart={() => setRecording(true)} onTouchEnd={() => { setRecording(false); showNotice('AI 正在整理你的信息'); }}><Text className='record-core'><Text className='mic-glyph'>⌕</Text></Text><Text className='record-label'>{recording ? '正在听' : '按住说话'}</Text></View><Text className='record-status'>{recording ? '松开后 AI 会自动整理' : '例如：有没有人收玉米？'}</Text></View> : <View className='typing-panel'><Text className='section-kicker'>文字输入</Text><Text className='typing-title'>写下你想找或想发布的内容</Text><Textarea className='typing-input' value={query} maxlength={200} placeholder='例如：城关镇有没有人收玉米？' onInput={(e) => setQuery(e.detail.value)} /><View className='typing-submit-row'><Text className='typing-count'>{query.length} / 200</Text><View className='typing-submit' onClick={submitSearch}>开始查找 <Text>↗</Text></View></View><Text className='typing-status'>内容越完整，AI 越容易帮你找到合适的信息。</Text><View className='search-hints'><Text>本镇刚刚有人在找</Text>{['收玉米', '下午装车', '二手农机'].map((item) => <Text key={item} className='hint-chip' onClick={() => setQuery(item)}>{item}</Text>)}</View></View>}
            <View className='voice-footer'><Text>✦ AI 会自动整理成信息</Text><Text className='text-button' onClick={() => go('/pages/ai/index')}>问问 AI ↗</Text></View>
          </View>
          <View className='pulse-card'><View className='pulse-heading'><Text>本镇脉搏</Text><Text className='icon'>↗</Text></View><View className='pulse-number'><Text className='pulse-total'>28</Text><Text className='pulse-unit'>条新信息</Text></View><View className='pulse-stats'><View><Text className='stat-dot yellow' /><Text className='stat-value'>6</Text><Text className='stat-label'>正在招人</Text></View><View><Text className='stat-dot orange' /><Text className='stat-value'>4</Text><Text className='stat-label'>刚刚有人响应</Text></View><View><Text className='stat-dot teal' /><Text className='stat-value'>12</Text><Text className='stat-label'>同镇新发布</Text></View></View><View className='mini-signal'>{[12,24,16,34,22,42,30,50,38,46,28,58,34,44,26].map((h, i) => <Text key={i} className='signal-bar' style={{ height: `${h}px` }} />)}</View><View className='signal-axis'><Text>06:00</Text><Text>现在</Text></View></View>
        </View>

        <View className='trust-strip'><Text className='icon'>♢</Text><Text>平台只做信息交流，不参与交易、不担保资金</Text><Text className='text-button'>了解安全规则 ↗</Text></View>

        <View className='section-heading'><View><Text className='section-kicker'>按你要办的事</Text><Text className='section-title'>现在想做什么？</Text></View><Text className='ghost-link' onClick={() => go('/pages/explore/index')}>看全部 →</Text></View>
        <View className='category-grid'>{categories.map((item) => <View key={item.title} className={`category-card category-${item.tone}`} onClick={() => go(`/pages/explore/index?category=${encodeURIComponent(item.title)}`)}><Text className='category-icon'>{item.icon}</Text><View><Text className='category-title'>{item.title}</Text><Text className='category-subtitle'>{item.subtitle}</Text></View><Text className='category-arrow'>↗</Text></View>)}</View>

        <View className='section-heading feed-heading'><View><Text className='section-kicker'>刚刚发生</Text><Text className='section-title'>本镇最新</Text></View><View className='feed-controls'>{['综合', '最新', '最近'].map((item, i) => <Text key={item} className={`filter-chip ${i === 0 ? 'active' : ''}`} onClick={() => showNotice(`${item}排序已切换`)}>{item}</Text>)}</View></View>
        <View className='feed-layout'><View className='feed-list'>{posts.map((post, i) => <View key={post.title} className={`post-card ${i === 0 ? 'featured-post' : ''}`}><View className={`post-image image-${post.tone}`}>{post.image ? <Image className='post-photo' src={post.image} mode='aspectFill' /> : <Text className='post-art'>{post.tone === 'tools' ? '农机具' : '下午急招'}</Text>}<View className='post-image-shade' /><Text className={`post-label label-${post.label}`}>{post.label}</Text><Text className='save-button' onClick={() => showNotice('已收藏')}>♡</Text></View><View className='post-body'><View className='post-meta'><Text>{post.type}</Text><Text>{post.age}</Text></View><Text className='post-title'>{post.title}</Text><Text className='post-summary'>{post.summary}</Text><View className='post-bottom'><View><Text className='post-price'>{post.price}<Text>{post.unit}</Text></Text><Text className={`response-note ${post.response.includes('缺') ? 'urgent' : ''}`}>◍ {post.response}</Text></View><View className='contact-button' onClick={() => showNotice(i === 2 ? '报名入口即将接入' : '联系入口即将接入')}>{i === 2 ? '我要报名' : '联系他'} ↗</View></View></View></View>)}</View></View>
        <View className='latest-side-grid'><View className='side-card scene-card'><Text className='section-kicker'>今日提醒</Text><Text className='side-icon'>☼</Text><Text className='side-title'>赶集日快到了</Text><Text className='side-copy'>本周六城关集市，已有 12 条助农信息。现在发布，周末更容易被看见。</Text><View className='outline-button' onClick={() => go('/pages/publish/index')}>发布一条信息 ↗</View></View><View className='side-card trust-card'><Text className='section-kicker'>先看一眼</Text><Text className='side-icon'>♢</Text><Text className='side-title'>遇到“先交钱”怎么办？</Text><Text className='safety-item'>不交押金、保证金、服装费</Text><Text className='safety-item'>不扫陌生二维码，不点陌生链接</Text><Text className='safety-item'>平台客服不会索要验证码</Text><Text className='ghost-link' onClick={() => showNotice('防骗指南已打开')}>打开防骗指南 →</Text></View></View>
      </View>

      <View className='mobile-bottom-nav'><View className='mobile-nav-item active'><Text>⌂</Text><Text>首页</Text></View><View className='mobile-nav-item' onClick={() => go('/pages/explore/index')}><Text>◌</Text><Text>逛一逛</Text></View><View className='mobile-nav-item mobile-publish' onClick={() => go('/pages/publish/index')}><Text className='publish-orb'>＋</Text><Text>发布</Text></View><View className='mobile-nav-item' onClick={() => showNotice('消息中心正在接入')}><Text>◍</Text><Text>消息</Text></View><View className='mobile-nav-item' onClick={() => showNotice('个人中心正在接入')}><Text>◉</Text><Text>我的</Text></View></View>
      {notice ? <Text className='sr-only'>{notice}</Text> : null}
    </View>
  );
}
