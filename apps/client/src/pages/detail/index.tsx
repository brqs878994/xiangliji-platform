import { Button, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { addResponse, getPost, getResponses, reportPost, toggleFavorite, type PlatformPost } from '../../services/platform';
import './detail.scss';

const currentUserId = 'user-demo';

export default function DetailPage() {
  const id = Taro.getCurrentInstance().router?.params?.id || '';
  const [post, setPost] = useState<(PlatformPost & { body: string; ownerId: string }) | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;
    Promise.all([getPost(id), getResponses(id)]).then(([nextPost, responses]) => {
      if (disposed) return;
      setPost(nextPost);
      setFavorite(responses.items.some((item) => item.userId === currentUserId && item.type === 'favorite'));
      setResponseCount(responses.items.filter((item) => item.type === 'contact' || item.type === 'signup').length);
    }).catch(() => Taro.showToast({ title: '信息不存在或已下架', icon: 'none' })).finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [id]);

  async function handleFavorite() {
    if (!post) return;
    const next = !favorite;
    setFavorite(next);
    try { await toggleFavorite(post.id, currentUserId, favorite); Taro.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' }); }
    catch { setFavorite(favorite); Taro.showToast({ title: '操作失败，请稍后重试', icon: 'none' }); }
  }

  async function respond(type: 'contact' | 'signup') {
    if (!post) return;
    try { await addResponse(post.id, { userId: currentUserId, type }); setResponseCount((value) => value + 1); Taro.showToast({ title: type === 'signup' ? '报名已提交' : '已留下联系意向', icon: 'none' }); }
    catch { Taro.showToast({ title: '操作失败，请稍后重试', icon: 'none' }); }
  }

  function report() {
    if (!post) return;
    Taro.showActionSheet({ itemList: ['虚假信息', '疑似诈骗', '其他违规'] }).then((result) => {
      const reasons = ['虚假信息', '疑似诈骗', '其他违规'];
      const reason = reasons[result.tapIndex];
      if (!reason) return;
      return reportPost(post.id, currentUserId, reason).then(() => Taro.showToast({ title: '举报已提交', icon: 'none' }));
    }).catch(() => undefined);
  }

  if (loading) return <View className='detail-page'><Text className='detail-empty'>正在加载信息…</Text></View>;
  if (!post) return <View className='detail-page'><Text className='detail-empty'>信息不存在或已下架</Text><Text className='detail-back' onClick={() => Taro.navigateBack()}>返回上一页</Text></View>;

  return <View className='detail-page'>
    <View className='detail-topbar'><Text className='detail-back' onClick={() => Taro.navigateBack()}>‹ 返回</Text><Text className='detail-kicker'>{post.category} · {post.townName}</Text><Text className='detail-report' onClick={report}>举报</Text></View>
    <View className='detail-layout'><View className='detail-main'><View className='detail-hero'><Text className='detail-hero-mark'>{post.category.slice(0, 1)}</Text><Text className='detail-hero-caption'>本镇真实信息</Text></View><View className='detail-content'><View className='detail-title-row'><View><Text className='detail-meta'>{post.townName} · {post.distanceKm ? `${post.distanceKm} 公里内` : '本镇'} · {new Date(post.publishedAt).toLocaleDateString()}</Text><Text className='detail-title'>{post.title}</Text></View><View className={`detail-favorite ${favorite ? 'saved' : ''}`} onClick={handleFavorite}>{favorite ? '★' : '☆'}</View></View><Text className='detail-body'>{post.body || post.summary}</Text><View className='detail-facts'><View><Text>有效期</Text><Text>{new Date(post.validUntil).toLocaleDateString()}</Text></View><View><Text>响应</Text><Text>{responseCount || post.responseLabel || '暂无'}</Text></View><View><Text>状态</Text><Text>展示中</Text></View></View><View className='detail-safety'><Text>♢</Text><View><Text>平台只做信息交流，不参与交易，不担保资金。</Text><Text>不要支付押金，不扫陌生二维码。</Text></View></View><View className='detail-actions'><Button onClick={() => void respond(post.category.includes('招工') || post.category.includes('任务') ? 'signup' : 'contact')}>{post.category.includes('招工') || post.category.includes('任务') ? '我要报名' : '联系发布者'}</Button><Text onClick={handleFavorite}>{favorite ? '取消收藏' : '收藏'}</Text></View></View></View><View className='detail-side'><View className='detail-side-card'><Text className='section-kicker'>发布者</Text><Text className='detail-owner'>李叔</Text><Text className='detail-owner-meta'>已认证发布者 · 本镇活跃</Text><Text className='detail-side-link' onClick={() => Taro.showToast({ title: '联系方式需在确认后展示', icon: 'none' })}>查看联系方式 ↗</Text></View><View className='detail-side-card'><Text className='section-kicker'>真实回音</Text><Text className='detail-number'>{responseCount}</Text><Text className='detail-side-copy'>条联系或报名记录</Text><Text className='detail-side-link' onClick={() => Taro.showToast({ title: '回应数据实时更新', icon: 'none' })}>查看响应记录 ↗</Text></View></View></View>
  </View>;
}
