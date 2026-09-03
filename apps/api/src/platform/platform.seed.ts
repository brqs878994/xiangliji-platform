import type { CategoryItem, PostRecord, TownItem } from './platform.types';

export const seedCategories: CategoryItem[] = [
  { id: 'farm', name: '助农供求', subtitle: '卖货 · 找收', enabled: true, sort: 1 },
  { id: 'jobs', name: '求职招工', subtitle: '找活 · 找人', enabled: true, sort: 2 },
  { id: 'tasks', name: '有偿任务', subtitle: '跑腿 · 代办', enabled: true, sort: 3 },
  { id: 'secondhand', name: '二手市场', subtitle: '闲置 · 农机', enabled: true, sort: 4 },
  { id: 'social', name: '约局互动', subtitle: '球局 · 拼车', enabled: true, sort: 5 },
];

export const seedTowns: TownItem[] = [{ code: 'chengguan', name: '城关镇', countyName: '示范县', enabled: true }];

export const seedPosts: PostRecord[] = [
  { id: 'post-corn-001', category: '助农供求', title: '收土鸡蛋，长期要货', townCode: 'chengguan', townName: '城关镇', distanceKm: 2.4, publishedAt: '2026-09-03T08:32:00+08:00', validUntil: '2026-09-10T23:59:59+08:00', summary: '每周稳定收 200 斤，个头均匀，城关镇可上门看货。', responseLabel: '2 人已联系', body: '每周稳定收 200 斤，个头均匀，城关镇可上门看货。', status: 'published', ownerId: 'user-demo' },
  { id: 'post-loading-001', category: '有偿任务', title: '下午装车，缺 5 人', townCode: 'chengguan', townName: '城关镇', distanceKm: 1.1, publishedAt: '2026-09-03T09:05:00+08:00', validUntil: '2026-09-10T14:00:00+08:00', summary: '今天 14:00 集合，做完结算，管一顿午饭。', responseLabel: '还缺 3 人', body: '今天 14:00 集合，做完结算，管一顿午饭。', status: 'published', ownerId: 'user-demo' },
  { id: 'post-machine-001', category: '二手市场', title: '旧打谷机，正常使用', townCode: 'chengguan', townName: '城关镇', distanceKm: 4.8, publishedAt: '2026-09-02T17:20:00+08:00', validUntil: '2026-09-16T23:59:59+08:00', summary: '有使用痕迹，配件齐全，王家镇自提。', responseLabel: '1 人已收藏', body: '有使用痕迹，配件齐全，王家镇自提。', status: 'published', ownerId: 'user-demo' },
];
