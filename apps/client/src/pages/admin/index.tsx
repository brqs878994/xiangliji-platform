import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { getAdminAudits, getAdminStats, getAiProviders, getAiRoutes, reviewAudit, type AiProvider, type AiRoute, type PlatformAudit } from '../../services/platform';
import './admin.scss';

export default function AdminPage() {
  const [stats, setStats] = useState({ publishedPosts: 0, pendingAudits: 0, categories: 0, towns: 0 });
  const [audits, setAudits] = useState<PlatformAudit[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [routes, setRoutes] = useState<AiRoute[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [nextStats, nextAudits, nextProviders, nextRoutes] = await Promise.all([getAdminStats(), getAdminAudits(), getAiProviders(), getAiRoutes()]);
      setStats(nextStats); setAudits(nextAudits.items); setProviders(nextProviders.items); setRoutes(nextRoutes.items);
    } catch { Taro.showToast({ title: '后台接口暂时不可用', icon: 'none' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  async function handleReview(audit: PlatformAudit, approved: boolean) {
    if (!approved && !reason.trim()) { Taro.showToast({ title: '请输入驳回原因', icon: 'none' }); return; }
    await reviewAudit(audit.id, approved, reason.trim());
    setReason('');
    Taro.showToast({ title: approved ? '已通过并上线' : '已驳回', icon: 'none' });
    void refresh();
  }

  return <View className='admin-page'>
    <View className='admin-topbar'><View><Text className='section-kicker'>乡里集运营台</Text><Text className='admin-title'>后台总览</Text></View><View className='admin-actions'><Button size='mini' onClick={() => void refresh()}>刷新</Button><Text className='back-link' onClick={() => Taro.navigateBack()}>返回前台</Text></View></View>
    <View className='stat-grid'>{[['已上线信息', stats.publishedPosts], ['待审核', stats.pendingAudits], ['启用分类', stats.categories], ['服务乡镇', stats.towns]].map(([label, value]) => <View className='stat-card' key={String(label)}><Text className='stat-value'>{String(value)}</Text><Text className='stat-label'>{label}</Text></View>)}</View>
    <View className='admin-section'><View className='section-heading'><View><Text className='section-kicker'>内容治理</Text><Text className='section-title'>审核队列</Text></View><Text className='section-count'>{audits.filter((item) => item.status === 'pending').length} 条待处理</Text></View>{loading ? <Text className='muted'>正在加载…</Text> : audits.length === 0 ? <Text className='muted'>暂无审核记录</Text> : <View className='audit-list'>{audits.map((audit) => <View className={`audit-card status-${audit.status}`} key={audit.id}><View className='audit-main'><View className='audit-head'><Text className='audit-title'>{audit.draft?.title || '未命名草稿'}</Text><Text className='audit-status'>{audit.status === 'pending' ? '待审核' : audit.status === 'approved' ? '已通过' : '已驳回'}</Text></View><Text className='audit-meta'>{audit.draft?.category || '未分类'} · {audit.draft?.townCode || '未知乡镇'} · {audit.draft?.userId || '未知用户'}</Text><Text className='audit-body'>{audit.draft?.body || audit.reason || '无内容'}</Text></View>{audit.status === 'pending' && <View className='audit-actions'><Input className='reason-input' value={reason} placeholder='驳回原因（驳回时必填）' onInput={(event) => setReason(event.detail.value)} /><View className='audit-buttons'><Button size='mini' className='reject' onClick={() => void handleReview(audit, false)}>驳回</Button><Button size='mini' className='approve' onClick={() => void handleReview(audit, true)}>通过并上线</Button></View></View>}</View>)}</View>}</View>
    <View className='admin-section'><View className='section-heading'><View><Text className='section-kicker'>智能体配置</Text><Text className='section-title'>Provider 与能力路由</Text></View></View><View className='provider-list'>{providers.map((provider) => <View className='provider-card' key={provider.id}><View><Text className='provider-name'>{provider.name}</Text><Text className='provider-meta'>{provider.protocol} · {provider.model}</Text></View><Text className={`provider-state ${provider.enabled ? 'on' : ''}`}>{provider.enabled ? '启用' : '停用'}</Text><Text className='provider-key'>{provider.apiKey || '未配置 Key'}</Text></View>)}</View><View className='route-list'>{routes.map((route) => <View className='route-row' key={route.capability}><Text>{route.capability}</Text><Text className='route-value'>{providers.find((provider) => provider.id === route.primaryProviderId)?.name || route.primaryProviderId}</Text><Text className={`route-state ${route.enabled ? 'on' : ''}`}>{route.enabled ? '已启用' : '已停用'}</Text></View>)}</View></View>
  </View>;
}
