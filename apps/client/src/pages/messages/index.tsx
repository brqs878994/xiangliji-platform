import { Input, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { getConversationMessages, getConversations, sendConversationMessage, type PlatformConversation, type PlatformMessage } from '../../services/platform';
import './messages.scss';

const currentUserId = 'user-demo';
const fallbackConversations: PlatformConversation[] = [
  { id: 'conversation-buyer-1', userId: currentUserId, participantName: '王师傅', preview: '鸡蛋还有吗？', unread: 2, updatedAt: new Date().toISOString() },
  { id: 'conversation-worker-1', userId: currentUserId, participantName: '装车联系人', preview: '下午两点集合', unread: 0, updatedAt: new Date(Date.now() - 86400000).toISOString() },
];
const fallbackMessages: Record<string, PlatformMessage[]> = {
  'conversation-buyer-1': [
    { id: 'fallback-1', conversationId: 'conversation-buyer-1', senderId: 'other', content: '你好，我看到你发布的土鸡蛋信息。', createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: 'fallback-2', conversationId: 'conversation-buyer-1', senderId: 'other', content: '鸡蛋还有吗？', createdAt: new Date(Date.now() - 60000).toISOString() },
  ],
  'conversation-worker-1': [{ id: 'fallback-3', conversationId: 'conversation-worker-1', senderId: 'other', content: '下午两点在城关仓库集合，到了发我消息。', createdAt: new Date(Date.now() - 86400000).toISOString() }],
};

function formatTime(value: string) {
  const date = new Date(value);
  return Date.now() - date.getTime() < 86400000 ? '刚刚' : '昨天';
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<PlatformConversation[]>(fallbackConversations);
  const [activeId, setActiveId] = useState(fallbackConversations[0].id);
  const [messages, setMessages] = useState<PlatformMessage[]>(fallbackMessages[fallbackConversations[0].id]);
  const [draft, setDraft] = useState('');
  const active = useMemo(() => conversations.find((item) => item.id === activeId) || conversations[0], [activeId, conversations]);

  useEffect(() => {
    let disposed = false;
    void getConversations(currentUserId).then((result) => {
      if (disposed || result.items.length === 0) return;
      setConversations(result.items);
      setActiveId((current) => result.items.some((item) => item.id === current) ? current : result.items[0].id);
    }).catch(() => undefined);
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    void getConversationMessages(active.id, currentUserId).then((result) => {
      if (!disposed) setMessages(result.items.length > 0 ? result.items : (fallbackMessages[active.id] || []));
    }).catch(() => { if (!disposed) setMessages(fallbackMessages[active.id] || []); });
    return () => { disposed = true; };
  }, [active]);

  async function send() {
    const value = draft.trim();
    if (!value) return;
    if (!active) return;
    try {
      const message = await sendConversationMessage(active.id, currentUserId, value);
      setMessages((items) => [...items, message]);
      setConversations((items) => items.map((item) => item.id === active.id ? { ...item, preview: value, updatedAt: message.createdAt } : item));
      setDraft('');
      Taro.showToast({ title: '消息已发送', icon: 'none' });
    } catch { Taro.showToast({ title: '消息发送失败，请稍后重试', icon: 'none' }); }
  }

  return <View className='messages-page'>
    <View className='messages-topbar'><Text className='back-link' onClick={() => Taro.navigateBack()}>‹ 返回</Text><View><Text className='section-kicker'>有人回应你 · 仅在平台内沟通</Text><Text className='page-title'>消息</Text></View><Text className='safety-link' onClick={() => Taro.showToast({ title: '不交押金，不扫陌生二维码', icon: 'none' })}>安全指南</Text></View>
    <View className='messages-layout'><View className='conversation-list'><Text className='list-title'>会话</Text>{conversations.map((item, index) => <View key={item.id} className={`conversation ${item.id === active?.id ? 'active' : ''}`} onClick={() => setActiveId(item.id)}><Text className={`conversation-avatar ${index % 2 === 0 ? 'orange' : 'teal'}`}>{item.participantName.slice(0, 1)}</Text><View><Text className='conversation-name'>{item.participantName}</Text><Text className='conversation-preview'>{item.preview}</Text></View><Text className='conversation-time'>{formatTime(item.updatedAt)}</Text>{item.unread > 0 && <Text className='conversation-unread'>{item.unread}</Text>}</View>)}</View>{active ? <View className='chat-panel'><View className='chat-head'><View><Text className='chat-name'>{active.participantName}</Text><Text className='chat-status'>平台内沟通 · 不展示私人联系方式</Text></View><Text className='chat-more' onClick={() => Taro.showToast({ title: '举报入口已准备', icon: 'none' })}>⋯</Text></View><View className='chat-safety'>♢ 不交押金、不扫陌生码，平台客服不会索要验证码</View><View className='chat-messages'><Text className='chat-time'>今天</Text>{messages.map((message) => <View key={message.id} className={`chat-bubble ${message.senderId === currentUserId ? 'mine' : 'other'}`}>{message.content}</View>)}</View><View className='chat-composer'><Text className='composer-action' onClick={() => Taro.showToast({ title: '语音消息正在接入', icon: 'none' })}>⌕</Text><Input value={draft} placeholder='写一句消息' onInput={(event) => setDraft(event.detail.value)} onConfirm={() => void send()} /><Text className='composer-send' onClick={() => void send()}>发送</Text></View></View> : <Text className='messages-empty'>暂无会话</Text>}</View>
  </View>;
}
