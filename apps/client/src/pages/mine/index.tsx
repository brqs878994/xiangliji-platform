import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { getMyPosts, getResponses, updatePostStatus, type PlatformPost } from '../../services/platform';
import './mine.scss';

const currentUserId = 'user-demo';

export default function MinePage() {
  const [posts, setPosts] = useState<PlatformPost[]>([]);
  const [tab, setTab] = useState<'published' | 'pending' | 'closed'>('published');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const result = await getMyPosts(currentUserId);
      setPosts(result.items);
      const entries = await Promise.all(result.items.map(async (post) => [post.id, (await getResponses(post.id)).items.filter((item) => item.type === 'contact' || item.type === 'signup').length] as const));
      setResponses(Object.fromEntries(entries));
    } catch { Taro.showToast({ title: '我的信息暂时不可用', icon: 'none' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  const visible = useMemo(() => posts.filter((post) => tab === 'closed' ? post.status === 'closed' : tab === 'pending' ? post.status === 'pending_review' : post.status === 'published'), [posts, tab]);
  async function closePost(post: PlatformPost) {
    const result = await Taro.showModal({ title: '标记已完成', content: '确认将这条信息标记为已完成并下架吗？' });
    if (!result.confirm) return;
    try { await updatePostStatus(post.id, currentUserId, 'closed'); Taro.showToast({ title: '已标记完成', icon: 'none' }); void refresh(); } catch { Taro.showToast({ title: '操作失败，请稍后重试', icon: 'none' }); }
  }
  return <View className='mine-page'><View className='mine-topbar'><Text className='back-link' onClick={() => Taro.navigateBack()}>‹ 返回</Text><View><Text className='section-kicker'>我的乡里集 · 发布与安全</Text><Text className='page-title'>我的</Text></View><Text className='settings-link' onClick={() => Taro.showToast({ title: '账号设置正在接入', icon: 'none' })}>设置</Text></View><View className='profile-hero'><View><Text className='profile-name'>李叔</Text><Text className='profile-meta'>城关镇 · 已认证发布者</Text></View><Text className='profile-badge'>本镇活跃</Text></View><View className='mine-stats'><View><Text>{posts.filter((post) => post.status === 'published').length}</Text><Text>展示中</Text></View><View><Text>{posts.filter((post) => post.status === 'pending_review').length}</Text><Text>待审核</Text></View><View><Text>{Object.values(responses).reduce((sum, count) => sum + count, 0)}</Text><Text>收到回应</Text></View><View><Text>0</Text><Text>收藏</Text></View></View><View className='mine-section'><View className='section-heading'><View><Text className='section-kicker'>我的信息</Text><Text className='section-title'>发布记录</Text></View><Text className='refresh-link' onClick={() => void refresh()}>刷新</Text></View><View className='mine-tabs'>{[['published', '展示中'], ['pending', '待审核'], ['closed', '已完成']].map(([value, label]) => <Text key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value as typeof tab)}>{label}</Text>)}</View>{loading ? <Text className='mine-empty'>正在加载…</Text> : visible.length === 0 ? <Text className='mine-empty'>这里还没有信息</Text> : visible.map((post) => <View className='mine-post' key={post.id}><View><Text className='mine-post-title'>{post.title}</Text><Text className='mine-post-meta'>{post.category} · {post.townName} · {responses[post.id] || 0} 条回应</Text></View><Text className={`mine-status ${post.status === 'published' ? 'live' : post.status === 'closed' ? 'done' : 'pending'}`}>{post.status === 'published' ? '展示中' : post.status === 'closed' ? '已完成' : '待审核'}</Text>{post.status === 'published' && <Text className='mine-action' onClick={() => void closePost(post)}>标记完成</Text>}</View>)}</View><View className='mine-safety'><Text className='section-kicker'>账号安全</Text><Text>不交押金，不扫陌生二维码，平台不会索要验证码。</Text><Text className='safety-link' onClick={() => Taro.showToast({ title: '安全指南已打开', icon: 'none' })}>查看防骗指南 →</Text></View></View>;
}
