const toast = document.querySelector('#toast');
const recordButton = document.querySelector('#recordButton');
const recordStatus = document.querySelector('#recordStatus');
const voiceCard = document.querySelector('#voiceCard');
const voiceMain = document.querySelector('#voiceMain');
const typingPanel = document.querySelector('#typingPanel');
const toggleTypeMode = document.querySelector('#toggleTypeMode');
const typeSearch = document.querySelector('#typeSearch');
const typeInput = document.querySelector('#typeInput');
const searchFallback = document.querySelector('#searchFallback');
const typingStatus = document.querySelector('#typingStatus');
const typingCount = document.querySelector('#typingCount');
const pageEyebrow = document.querySelector('#pageEyebrow');
const pageTitle = document.querySelector('#pageTitle');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function setStatus(message) {
  recordStatus.textContent = message;
  typingStatus.textContent = message;
}

function setInputMode(mode) {
  const textMode = mode === 'text';
  voiceCard.classList.toggle('typing-open', textMode);
  voiceMain.hidden = textMode;
  typingPanel.hidden = !textMode;
  toggleTypeMode.setAttribute('aria-pressed', String(textMode));
  toggleTypeMode.querySelector('span').textContent = textMode ? '切回语音' : '改用文字输入';
  toggleTypeMode.querySelector('svg')?.remove();
  toggleTypeMode.insertAdjacentHTML('afterbegin', `<i data-lucide="${textMode ? 'mic' : 'keyboard'}"></i>`);
  refreshIcons();
  if (textMode) window.setTimeout(() => typeInput.focus(), 60);
}

function setView(view) {
  const meta = {
    home: { eyebrow: '城关镇 · 星期三 9月2日', title: '今天，镇上有什么新消息？' },
    explore: { eyebrow: '本镇信息场 · 距离优先', title: '逛一逛' },
    publish: { eyebrow: '一条信息，三步发出', title: '把你知道的，告诉同镇的人' },
    detail: { eyebrow: '信息详情 · 平台担保提示', title: '看看这条信息' },
    ai: { eyebrow: '乡里集 AI · 只答真实信息', title: '问问 AI' },
    messages: { eyebrow: '有人回应你 · 仅在平台内沟通', title: '消息' },
    mine: { eyebrow: '我的乡里集 · 发布与安全', title: '我的' },
  };
  const next = meta[view] ? view : 'home';
  document.querySelectorAll('.rail-item[data-view], .mobile-nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === next));
  document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === next));
  pageEyebrow.textContent = meta[next].eyebrow;
  pageTitle.textContent = meta[next].title;
  document.body.classList.remove('page-changing');
  void document.body.offsetWidth;
  document.body.classList.add('page-changing');
  window.setTimeout(() => document.body.classList.remove('page-changing'), 420);
  if (window.location.hash !== `#${next}`) window.history.replaceState(null, '', `#${next}`);
  refreshIcons();
}

document.querySelectorAll('[data-view]').forEach((item) => item.addEventListener('click', (event) => {
  if (item.tagName === 'BUTTON') event.preventDefault();
  setView(item.dataset.view);
}));

document.querySelectorAll('.filter-chip').forEach((chip) => chip.addEventListener('click', () => {
  chip.parentElement.querySelectorAll('.filter-chip').forEach((item) => item.classList.remove('active'));
  chip.classList.add('active');
  showToast(`已切换为“${chip.textContent}”排序`);
}));

document.querySelectorAll('.category-card').forEach((card) => card.addEventListener('click', () => {
  setView('explore');
  showToast(`已打开${card.dataset.category}，正在展示本镇相关信息`);
}));

document.querySelectorAll('.contact-button, .outline-button').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action || '操作'}已加入下一步`)));

document.querySelectorAll('.save-button').forEach((button) => button.addEventListener('click', () => {
  button.classList.toggle('saved');
  showToast(button.classList.contains('saved') ? '已收藏这条信息' : '已取消收藏');
}));

document.querySelectorAll('#safetyButton, #guideButton').forEach((button) => button.addEventListener('click', () => showToast('防骗指南已打开：不交前置费用，不扫陌生二维码')));
typeSearch.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = typeInput.value.trim();
  if (!query) {
    showToast('先输入你想找或想发布的内容');
    typeInput.focus();
    return;
  }
  const hasLikelyMatch = /玉米|装车|农机|工作|鸡蛋|打谷/.test(query);
  searchFallback.hidden = hasLikelyMatch;
  setStatus(hasLikelyMatch ? `AI 正在整理“${query}”…` : `暂时没找到“${query}”，可以帮你发一条`);
  showToast(hasLikelyMatch ? `已收到“${query}”，正在匹配本镇信息` : `暂时没找到“${query}”，可以帮你发一条`);
  window.setTimeout(() => { setStatus('内容越完整，AI 越容易帮你找到合适的信息。'); }, 2600);
});

document.querySelector('#publishFromSearch').addEventListener('click', () => {
  setStatus(`已生成“${typeInput.value.trim() || '本镇需求'}”发布草稿`);
  showToast('已生成发布草稿，补充地点和联系方式即可发布');
});

document.querySelectorAll('.search-hints [data-query]').forEach((hint) => hint.addEventListener('click', () => {
  typeInput.value = hint.dataset.query;
  typingCount.textContent = `${typeInput.value.length} / 200`;
  typeInput.focus();
  showToast(`已填入“${hint.dataset.query}”，点击搜索查看本镇信息`);
}));

toggleTypeMode.addEventListener('click', () => setInputMode(voiceCard.classList.contains('typing-open') ? 'voice' : 'text'));
typeInput.addEventListener('input', () => { typingCount.textContent = `${typeInput.value.length} / 200`; });
document.querySelector('#mobilePublish').addEventListener('click', () => setView('publish'));

document.querySelectorAll('[data-open-detail]').forEach((item) => item.addEventListener('click', (event) => {
  event.stopPropagation();
  setView('detail');
}));

document.querySelector('#publishRecord').addEventListener('pointerdown', (event) => {
  const button = event.currentTarget;
  button.classList.add('recording');
  button.setPointerCapture?.(event.pointerId);
  showToast('正在听，你可以继续说…');
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => document.querySelector('#publishRecord').addEventListener(type, (event) => {
  const button = event.currentTarget;
  if (button.classList.contains('recording')) {
    button.classList.remove('recording');
    showToast('已收到语音，正在生成发布草稿');
    document.querySelector('.status-dot').textContent = 'AI 整理中';
  }
}));
document.querySelector('#publishTextMode').addEventListener('click', () => showToast('文字草稿模式已打开，可直接填写标题和正文'));
document.querySelector('#previewDraft').addEventListener('click', () => {
  document.querySelector('.status-dot').textContent = '草稿已生成';
  showToast('草稿已生成，确认字段后即可发布');
});

document.querySelectorAll('.explore-search button').forEach((button) => button.addEventListener('click', () => {
  const input = document.querySelector('#exploreSearch');
  const query = input.value.trim();
  showToast(query ? `正在查找“${query}”的本镇信息` : '输入关键词，查找本镇信息');
}));
document.querySelector('#exploreSearch').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.currentTarget.parentElement.querySelector('button').click();
  }
});

document.querySelectorAll('.conversation').forEach((item) => item.addEventListener('click', () => {
  document.querySelectorAll('.conversation').forEach((conversation) => conversation.classList.remove('active'));
  item.classList.add('active');
  showToast(`已打开${item.querySelector('strong')?.textContent || '会话'}`);
}));
document.querySelector('#chatComposer').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = event.currentTarget.querySelector('input');
  if (!input.value.trim()) return showToast('先写一句消息');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble mine';
  bubble.textContent = input.value.trim();
  document.querySelector('.chat-messages').appendChild(bubble);
  input.value = '';
  showToast('消息已发送');
});
document.querySelector('#aiComposer').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#aiInput');
  if (!input.value.trim()) return showToast('说一句你想找的内容');
  document.querySelector('.user-message').textContent = input.value.trim();
  input.value = '';
  showToast('AI 正在匹配本镇信息');
});
document.querySelectorAll('[data-ai-query]').forEach((button) => button.addEventListener('click', () => {
  document.querySelector('#aiInput').value = button.dataset.aiQuery;
  document.querySelector('#aiInput').focus();
}));
document.querySelectorAll('.mine-tabs button').forEach((tab) => tab.addEventListener('click', () => {
  tab.parentElement.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
  tab.classList.add('active');
  showToast(`已切换到${tab.textContent}`);
}));
document.querySelectorAll('#messageSafety, #chatGuide, #chatReport, #detailGuide').forEach((button) => button.addEventListener('click', () => showToast('安全指南已打开：不交押金，不扫陌生二维码')));
document.querySelector('#profileSettings').addEventListener('click', () => showToast('个人设置已打开'));

let recordingTimer;
recordButton.addEventListener('pointerdown', (event) => {
  recordButton.classList.add('recording');
  voiceCard.classList.add('is-recording');
  setStatus('正在听，你可以继续说…');
  recordButton.setPointerCapture?.(event.pointerId);
  recordingTimer = window.setTimeout(() => {
    recordButton.classList.remove('recording');
    voiceCard.classList.remove('is-recording');
    setStatus('AI 正在整理你的信息…');
    showToast('已收到语音，正在生成发布草稿');
    window.setTimeout(() => { setStatus('例如：有没有人收玉米？'); }, 2200);
  }, 1300);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => recordButton.addEventListener(type, () => {
  if (recordButton.classList.contains('recording')) {
    window.clearTimeout(recordingTimer);
    recordButton.classList.remove('recording');
    voiceCard.classList.remove('is-recording');
    setStatus('AI 正在整理你的信息…');
    showToast('已收到语音，正在生成发布草稿');
    window.setTimeout(() => { setStatus('例如：有没有人收玉米？'); }, 2200);
  }
}));

refreshIcons();
const initialView = window.location.hash.replace('#', '');
if (initialView && document.querySelector(`[data-panel="${initialView}"]`)) setView(initialView);
