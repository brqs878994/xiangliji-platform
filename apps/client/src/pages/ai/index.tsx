import { useEffect, useState } from 'react';
import { Button, Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { ChatEvent } from '@xiangliji/ai-contracts';
import type { PostCard } from '@xiangliji/domain';
import { streamChat } from '../../services/ai';
import './ai.scss';

export default function AiPage() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [cards, setCards] = useState<PostCard[]>([]);
  const [action, setAction] = useState<ChatEvent & { type: 'action' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params ?? {};
    if (params.query) setMessage(decodeURIComponent(params.query));
  }, []);

  async function submit() {
    const value = message.trim();
    if (!value || loading) return;
    setLoading(true);
    setAnswer('');
    setCards([]);
    setAction(null);
    setLoginRequired(false);

    try {
      await streamChat(
        {
          sessionId: 'demo-session',
          userId: null,
          townCode: 'chengguan',
          message: value,
          history: [],
        },
        (event) => {
          if (event.type === 'text_delta') setAnswer((current) => current + event.text);
          if (event.type === 'cards') setCards(event.cards);
          if (event.type === 'action') setAction(event);
          if (event.type === 'warning' && event.code === 'login_required') setLoginRequired(true);
          if (event.type === 'error') setAnswer(event.message);
        },
      );
    } catch {
      Taro.showToast({ title: 'AI 暂时不可用', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className='ai-page'>
      <View className='ai-topbar'>
        <Text className='back' onClick={() => Taro.navigateBack()}>返回</Text>
        <Text className='ai-title'>问问 AI</Text>
      </View>
      <Text className='ai-subtitle'>只回答本镇真实信息，普通问题也可以直接问。</Text>
      <View className='quick-questions'>
        {['有没有人收玉米', '有没有人收荔枝', '玉米什么时候收比较好', '今天镇上有什么新消息'].map((item) => (
          <Text key={item} className='quick-question' onClick={() => setMessage(item)}>{item}</Text>
        ))}
      </View>
      <View className='answer-panel'>
        {!answer && !loading && <Text className='empty'>先问一句你想找的内容</Text>}
        {loading && !answer && <Text className='empty'>AI 正在匹配本镇信息…</Text>}
        {answer && <Text className='answer'>{answer}</Text>}
        {cards.map((card) => (
          <View key={card.id} className='result-card'>
            <Text className='result-category'>{card.category}</Text>
            <Text className='result-title'>{card.title}</Text>
            <Text className='result-meta'>{card.townName} · {card.distanceKm} km · {card.responseLabel}</Text>
            <Text className='result-summary'>{card.summary}</Text>
          </View>
        ))}
        {action && (
          <View className='action-card'>
            <Text>没有匹配到现成信息，可以生成一条发布草稿。</Text>
            {loginRequired && <Text className='login-note'>登录后才能保存草稿</Text>}
            <Button size='mini' onClick={() => Taro.showToast({ title: loginRequired ? '请先登录' : '草稿已准备', icon: 'none' })}>生成发布草稿</Button>
          </View>
        )}
      </View>
      <View className='composer'>
        <Input
          className='composer-input'
          value={message}
          maxlength={200}
          placeholder='例如：有没有人收玉米？'
          onInput={(event) => setMessage(event.detail.value)}
          onConfirm={submit}
        />
        <Button className='composer-button' loading={loading} onClick={submit}>发送</Button>
      </View>
    </View>
  );
}
