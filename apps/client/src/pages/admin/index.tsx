import { Button, Input, Picker, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { createAiProvider, getAdminAudits, getAdminStats, getAiProviders, getAiRoutes, reviewAudit, updateAiProvider, updateAiRoute, type AiProvider, type AiRoute, type PlatformAudit } from '../../services/platform';
import './admin.scss';

export default function AdminPage() {
  const [stats, setStats] = useState({ publishedPosts: 0, pendingAudits: 0, categories: 0, towns: 0 });
  const [audits, setAudits] = useState<PlatformAudit[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [routes, setRoutes] = useState<AiRoute[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({ name: '', baseUrl: '', apiKey: '', model: '', timeoutMs: '15000', maxTokens: '2000', enabled: true });

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

  function startProvider(provider?: AiProvider) {
    setEditingProvider(provider?.id || 'new');
    setProviderForm({ name: provider?.name || '', baseUrl: provider?.baseUrl || '', apiKey: '', model: provider?.model || '', timeoutMs: String(provider?.timeoutMs || 15000), maxTokens: String(provider?.maxTokens || 2000), enabled: provider?.enabled ?? true });
  }

  async function saveProvider() {
    if (!providerForm.name.trim() || !providerForm.model.trim()) { Taro.showToast({ title: '名称和模型不能为空', icon: 'none' }); return; }
    try {
      const payload = { name: providerForm.name.trim(), protocol: 'openai-compatible' as const, baseUrl: providerForm.baseUrl.trim() || null, apiKey: providerForm.apiKey.trim() || undefined, model: providerForm.model.trim(), timeoutMs: Number(providerForm.timeoutMs) || 15000, maxTokens: Number(providerForm.maxTokens) || 2000, enabled: providerForm.enabled };
      if (editingProvider === 'new') await createAiProvider(payload); else if (editingProvider) await updateAiProvider(editingProvider, payload);
      setEditingProvider(null); Taro.showToast({ title: 'Provider 配置已保存', icon: 'none' }); void refresh();
    } catch { Taro.showToast({ title: 'Provider 配置无效，请检查 HTTPS 地址和参数', icon: 'none' }); }
  }

  async function selectRoute(route: AiRoute, event: { detail: { value: string | number } }) {
    const primaryProviderId = providers[Number(event.detail.value)]?.id;
    if (!primaryProviderId) return;
    try { await updateAiRoute(route.capability, { primaryProviderId, fallbackProviderId: route.fallbackProviderId, enabled: route.enabled }); Taro.showToast({ title: '能力路由已更新', icon: 'none' }); void refresh(); }
    catch { Taro.showToast({ title: '路由更新失败', icon: 'none' }); }
  }

  return <View className='admin-page'>
    <View className='admin-topbar'><View><Text className='section-kicker'>乡里集运营台</Text><Text className='admin-title'>后台总览</Text></View><View className='admin-actions'><Button size='mini' onClick={() => void refresh()}>刷新</Button><Text className='back-link' onClick={() => Taro.navigateBack()}>返回前台</Text></View></View>
    <View className='stat-grid'>{[['已上线信息', stats.publishedPosts], ['待审核', stats.pendingAudits], ['启用分类', stats.categories], ['服务乡镇', stats.towns]].map(([label, value]) => <View className='stat-card' key={String(label)}><Text className='stat-value'>{String(value)}</Text><Text className='stat-label'>{label}</Text></View>)}</View>
    <View className='admin-section'><View className='section-heading'><View><Text className='section-kicker'>内容治理</Text><Text className='section-title'>审核队列</Text></View><Text className='section-count'>{audits.filter((item) => item.status === 'pending').length} 条待处理</Text></View>{loading ? <Text className='muted'>正在加载…</Text> : audits.length === 0 ? <Text className='muted'>暂无审核记录</Text> : <View className='audit-list'>{audits.map((audit) => <View className={`audit-card status-${audit.status}`} key={audit.id}><View className='audit-main'><View className='audit-head'><Text className='audit-title'>{audit.draft?.title || '未命名草稿'}</Text><Text className='audit-status'>{audit.status === 'pending' ? '待审核' : audit.status === 'approved' ? '已通过' : '已驳回'}</Text></View><Text className='audit-meta'>{audit.draft?.category || '未分类'} · {audit.draft?.townCode || '未知乡镇'} · {audit.draft?.userId || '未知用户'}</Text><Text className='audit-body'>{audit.draft?.body || audit.reason || '无内容'}</Text></View>{audit.status === 'pending' && <View className='audit-actions'><Input className='reason-input' value={reason} placeholder='驳回原因（驳回时必填）' onInput={(event) => setReason(event.detail.value)} /><View className='audit-buttons'><Button size='mini' className='reject' onClick={() => void handleReview(audit, false)}>驳回</Button><Button size='mini' className='approve' onClick={() => void handleReview(audit, true)}>通过并上线</Button></View></View>}</View>)}</View>}</View>
    <View className='admin-section'><View className='section-heading'><View><Text className='section-kicker'>智能体配置</Text><Text className='section-title'>Provider 与能力路由</Text></View><Button size='mini' onClick={() => startProvider()}>新增 Provider</Button></View><View className='provider-list'>{providers.map((provider) => <View className='provider-card' key={provider.id}><View><Text className='provider-name'>{provider.name}</Text><Text className='provider-meta'>{provider.protocol} · {provider.model} · {provider.baseUrl || '未配置 Base URL'}</Text></View><Text className={`provider-state ${provider.enabled ? 'on' : ''}`}>{provider.enabled ? '启用' : '停用'}</Text><Text className='provider-key'>{provider.apiKey || '未配置 Key'}</Text><Text className='provider-edit' onClick={() => startProvider(provider)}>编辑</Text></View>)}</View>{editingProvider && <View className='provider-editor'><Text className='editor-title'>{editingProvider === 'new' ? '新增 Provider' : '编辑 Provider'}</Text><Input placeholder='名称' value={providerForm.name} onInput={(event) => setProviderForm((form) => ({ ...form, name: event.detail.value }))} /><Input placeholder='Base URL（必须 HTTPS）' value={providerForm.baseUrl} onInput={(event) => setProviderForm((form) => ({ ...form, baseUrl: event.detail.value }))} /><Input placeholder='API Key（留空保持原值）' password value={providerForm.apiKey} onInput={(event) => setProviderForm((form) => ({ ...form, apiKey: event.detail.value }))} /><Input placeholder='模型名称' value={providerForm.model} onInput={(event) => setProviderForm((form) => ({ ...form, model: event.detail.value }))} /><View className='editor-inline'><Input type='number' placeholder='超时 ms' value={providerForm.timeoutMs} onInput={(event) => setProviderForm((form) => ({ ...form, timeoutMs: event.detail.value }))} /><Input type='number' placeholder='最大 Token' value={providerForm.maxTokens} onInput={(event) => setProviderForm((form) => ({ ...form, maxTokens: event.detail.value }))} /></View><View className='editor-actions'><Button size='mini' onClick={() => setEditingProvider(null)}>取消</Button><Button size='mini' onClick={() => void saveProvider()}>保存配置</Button></View></View>}<View className='route-list'>{routes.map((route) => { const selected = Math.max(0, providers.findIndex((provider) => provider.id === route.primaryProviderId)); return <View className='route-row' key={route.capability}><Text>{route.capability}</Text><Picker mode='selector' range={providers.map((provider) => provider.name)} value={selected} onChange={(event) => void selectRoute(route, event)}><Text className='route-value'>{providers[selected]?.name || route.primaryProviderId} ›</Text></Picker><Text className={`route-state ${route.enabled ? 'on' : ''}`}>{route.enabled ? '已启用' : '已停用'}</Text></View>; })}</View></View>
  </View>;
}
