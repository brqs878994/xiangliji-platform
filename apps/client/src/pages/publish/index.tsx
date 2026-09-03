import { Picker, Text, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useState } from 'react';
import './publish.scss';
import { createDraft, fallbackCategories, getCategories, submitDraftReview, type PlatformCategory } from '../../services/platform';

type Draft = { category: string; title: string; location: string; validity: string };

export default function PublishPage() {
  const params = Taro.getCurrentInstance().router?.params ?? {};
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [recording, setRecording] = useState(false);
  const [content, setContent] = useState(params.query || '');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>({ category: '助农供求 · 农产品', title: '城关镇土鸡蛋，长期要货', location: '城关镇 · 可修改', validity: '7 天' });
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [categories, setCategories] = useState<PlatformCategory[]>(fallbackCategories);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => { void getCategories().then(setCategories); }, []);

  const categoryOptions = categories.map((item) => `${item.name} · ${item.subtitle}`);

  function notify(message: string) { Taro.showToast({ title: message, icon: 'none' }); }
  function makeDraft() {
    if (!content.trim()) { notify('先说说你要发布的内容'); return; }
    setDraft((current) => ({ ...current, title: content.trim().slice(0, 28) }));
    setStep(2);
    notify('AI 已整理成草稿');
  }

  async function saveDraft() {
    if (!content.trim()) { notify('先说说你要发布的内容'); return; }
    try {
      const category = categories[categoryIndex]?.name || '助农供求';
      const result = draftId ? null : await createDraft({ userId: 'user-demo', title: draft.title || content.trim().slice(0, 28), category, townCode: 'chengguan', body: content.trim() });
      if (result) setDraftId(result.id);
      setStep(2);
      notify('草稿已保存');
    } catch { notify('草稿保存失败，请稍后重试'); }
  }

  function submitReview() {
    if (!draftId) { void saveDraft(); return; }
    Taro.showModal({ title: '确认提交审核', content: '提交后将进入平台审核，确认继续吗？', success: (res) => {
      if (!res.confirm) return;
      void submitDraftReview(draftId, 'user-demo').then(() => { setStep(3); notify('已提交审核，等待平台处理'); }).catch(() => notify('提交失败，请稍后重试'));
    } });
  }

  return <View className='publish-page'>
    <View className='publish-topbar'><Text className='back-link' onClick={() => Taro.navigateBack()}>‹ 返回</Text><View><Text className='section-kicker'>一条信息，三步发出</Text><Text className='page-title'>发布信息</Text></View><Text className='draft-status'>▣ 草稿自动保存</Text></View>
    <Text className='intro-copy'>把你知道的，告诉同镇的人。语音会自动整理，发布前你可以随时修改。</Text>
    <View className='steps'>{[['01', '说一说'], ['02', '核对一下'], ['03', '发布结果']].map(([number, label], index) => <View key={number} className={`step ${step === index + 1 ? 'active' : ''}`}><Text>{number}</Text><Text>{label}</Text></View>)}</View>
    <View className='publish-layout'><View className='capture-card'><View className='capture-head'><Text className='live-label'><Text className='live-dot' />{mode === 'voice' ? '语音发布' : '文字发布'}</Text><Text>预计 30 秒完成</Text></View>{mode === 'voice' ? <View className='capture-main'><View className='capture-wave'>{[18,32,24,42,27,50,34,44,20].map((height, i) => <Text key={i} style={{ height: `${height}px` }} />)}</View><View className={`capture-button ${recording ? 'recording' : ''}`} onTouchStart={() => setRecording(true)} onTouchEnd={() => { setRecording(false); setContent('收土鸡蛋，长期要货，城关镇可上门看货'); setStep(2); notify('语音已转成草稿'); }}><Text className='capture-orb'>⌕</Text><Text className='capture-label'>{recording ? '正在听' : '按住说话'}</Text><Text className='capture-hint'>说清楚“要找谁 / 在哪 / 什么时候”</Text></View></View> : <View className='text-capture'><Textarea value={content} maxlength={200} placeholder='例如：下午找 2 个装车工，260 元/天' onInput={(e) => setContent(e.detail.value)} /><View className='text-count'>{content.length} / 200</View><View className='make-draft' onClick={makeDraft}>生成草稿 ↗</View></View>}<View className='capture-bottom'><Text>♢ 平台只做信息交流，不担保资金</Text><Text className='mode-toggle' onClick={() => setMode(mode === 'voice' ? 'text' : 'voice')}>{mode === 'voice' ? '改用文字' : '切回语音'}</Text></View></View><View className='preview-card'><View className='preview-head'><Text>你会看到这样的草稿</Text><Text className='status-dot'>{step === 3 ? '已提交审核' : step > 1 ? 'AI 已整理' : 'AI 待整理'}</Text></View><Picker mode='selector' range={categoryOptions} value={categoryIndex} onChange={(event) => { const next = Number(event.detail.value); setCategoryIndex(next); setDraft((current) => ({ ...current, category: categoryOptions[next] })); }}><View className='preview-line category-picker-line'><Text>分类</Text><Text>{draft.category} ›</Text></View></Picker><View className='preview-line'><Text>标题</Text><Text>{draft.title}</Text></View><View className='preview-line'><Text>地点</Text><Text>{draft.location}</Text></View><View className='preview-line'><Text>有效期</Text><Text>{draft.validity}⌄</Text></View><View className={`review-button ${step > 1 ? 'ready' : ''}`} onClick={() => step === 1 ? makeDraft() : step === 2 ? saveDraft() : submitReview()}>{step === 1 ? '先看一眼草稿' : step === 2 ? '保存草稿' : '提交审核'} ✦</View><Text className='preview-note'>未识别的内容会高亮提醒，不会静默发布。</Text></View></View>
    <View className='publish-trust-row'><View className='trust-item'><Text className='trust-icon'>◷</Text><Text className='trust-copy'><b>发出去之后</b>有人收藏、联系或报名，你会马上收到提醒</Text></View><View className='trust-item'><Text className='trust-icon'>▧</Text><Text className='trust-copy'><b>补一张图片</b>信息更容易被同镇的人看见</Text></View><View className='trust-item'><Text className='trust-icon'>↻</Text><Text className='trust-copy'><b>过期可续期</b>不用重新填写整条信息</Text></View></View>
  </View>;
}
