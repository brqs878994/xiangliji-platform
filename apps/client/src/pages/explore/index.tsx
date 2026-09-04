import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import './explore.scss';
import { fallbackCategories, getCategories, getPosts, type PlatformCategory, type PlatformPost } from '../../services/platform';

function toneForCategory(category: string) {
  if (category.includes('助农')) return 'green';
  if (category.includes('招工') || category.includes('零工')) return 'yellow';
  if (category.includes('二手')) return 'teal';
  return 'orange';
}

export default function ExplorePage() {
  const params = Taro.getCurrentInstance().router?.params ?? {};
  const [keyword, setKeyword] = useState('');
  const initialCategory = params.category ? decodeURIComponent(params.category) : '全部';
  const [filter, setFilter] = useState(initialCategory);
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [categories, setCategories] = useState<PlatformCategory[]>(fallbackCategories);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setLoadError(false);
    Promise.all([
      getPosts({ townCode: 'chengguan', category: initialCategory === '全部' ? undefined : initialCategory }),
      getCategories(),
    ]).then(([nextPosts, nextCategories]) => {
      if (disposed) return;
      setPosts(nextPosts);
      setCategories(nextCategories);
    }).catch(() => {
      if (disposed) return;
      setPosts([]);
      setLoadError(true);
    }).finally(() => {
      if (!disposed) setLoading(false);
    });
    return () => { disposed = true; };
  }, [initialCategory]);

  const filtered = useMemo(() => posts.filter((post) => {
    const normalizedFilter = filter.replace('供求', '').replace('市场', '').replace('求职', '').replace('有偿', '').replace('日结零工', '零工');
    const matchFilter = filter === '全部' || post.category.includes(normalizedFilter) || normalizedFilter.includes(post.category);
    const matchKeyword = !keyword.trim() || `${post.title}${post.summary}${post.category}`.includes(keyword.trim());
    return matchFilter && matchKeyword;
  }), [filter, keyword, posts]);

  function notify(message: string) { Taro.showToast({ title: message, icon: 'none' }); }

  return <View className='explore-page'>
    <View className='explore-topbar'><Text className='back-link' onClick={() => Taro.navigateBack()}>‹ 返回</Text><View><Text className='section-kicker'>本镇信息场</Text><Text className='page-title'>逛一逛</Text></View><View className='top-action' onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}>＋ 发布</View></View>
    <Text className='intro-copy'>先看离你近的，再看刚刚发生的。</Text>
    <View className='explore-search'><Text className='search-icon'>⌕</Text><Input value={keyword} placeholder='搜收购、招工、农机或关键词' onInput={(e) => setKeyword(e.detail.value)} /><Text className='search-submit' onClick={() => notify(keyword ? `正在查找“${keyword}”` : '输入关键词开始查找')}>↗</Text></View>
    <View className='filter-row'>{['全部', ...categories.map((item) => item.name)].map((item) => <Text key={item} className={`filter-chip ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)}>{item.replace('供求', '').replace('市场', '')}</Text>)}</View>
    <View className='hot-row'><Text className='live-dot' /><Text className='hot-label'>本镇热搜</Text>{['收玉米', '下午装车', '二手农机'].map((item) => <Text key={item} className='hot-chip' onClick={() => setKeyword(item)}>{item}</Text>)}</View>
    <View className='explore-layout'><View className='explore-list'>{loading ? <View className='empty-state'><Text className='empty-title'>正在加载本镇信息</Text><Text className='empty-copy'>正在连接信息服务，请稍候。</Text></View> : loadError ? <View className='empty-state'><Text className='empty-title'>信息服务暂时不可用</Text><Text className='empty-copy'>请检查 API 服务后重新加载。</Text><Text className='publish-link' onClick={() => Taro.reLaunch({ url: '/pages/explore/index' })}>重新加载 ↻</Text></View> : filtered.length ? filtered.map((post, index) => <View key={post.id} className={`explore-card ${index === 0 ? 'featured' : ''}`} onClick={() => notify(`已打开${post.title}`)}><View className={`explore-media media-${toneForCategory(post.category)}`}><Text className='media-category'>{post.category}</Text><Text className='media-title'>{post.title}</Text><Text className='media-detail'>{post.summary}</Text></View><View className='explore-card-foot'><View><Text className='card-value'>{post.responseLabel || '待响应'}</Text><Text className='card-state'>{post.townName} · {post.distanceKm ? `${post.distanceKm} 公里内` : '本镇'}</Text></View><Text className='card-action'>{post.category.includes('招工') || post.category.includes('零工') ? '我要报名' : '查看详情'} ↗</Text></View></View>) : <View className='empty-state'><Text className='empty-title'>暂时没找到相关信息</Text><Text className='empty-copy'>换个关键词试试，或者让 AI 帮你发布一条需求。</Text><Text className='publish-link' onClick={() => Taro.navigateTo({ url: `/pages/publish/index?query=${encodeURIComponent(keyword)}` })}>帮我发布 ↗</Text></View>}</View><View className='explore-aside'><View className='aside-card'><Text className='section-kicker'>今日趋势</Text><Text className='aside-title'>大家正在找什么</Text>{['收玉米', '日结装车', '二手农机'].map((item, index) => <View className='trend-row' key={item}><Text className='trend-index'>0{index + 1}</Text><Text>{item}</Text><Text className='trend-rate'>+{18 - index * 6}%</Text></View>)}<Text className='publish-link' onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}>没有找到？帮我发布 →</Text></View><View className='aside-card dark-card'><Text className='section-kicker'>本镇脉搏</Text><Text className='big-number'>28</Text><Text className='dark-copy'>条新信息正在流动</Text><View className='aside-bars'>{[22,34,27,44,32,52,38,48].map((height, i) => <Text key={i} style={{ height: `${height}px` }} />)}</View></View></View></View>
  </View>;
}
