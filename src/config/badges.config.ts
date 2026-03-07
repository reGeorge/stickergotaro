export interface BadgeDef {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgGradient: string;
  philosophy: string;
  philosophyDesc: string;
  condition: string;
  keywords: string[];
}

export const BADGE_DEFINITIONS: BadgeDef[] = [
  {
    id: 'badge-courage',
    title: '勇敢小狮子',
    icon: '🦁',
    color: 'text-orange-500',
    bgGradient: 'from-orange-100 to-orange-200',
    philosophy: '突破与超人哲学 (Übermensch)',
    philosophyDesc: '真正的勇气不是打败别人，而是不断“自我超越”、“打破昨天的我”。面对困难也能迎难而上。',
    condition: '你今天尝试了以前不敢做的事情，或者努力跨出新的一步！',
    keywords: ['勇敢', '挑战', '不怕', '坚强', '克服', '突破']
  },
  {
    id: 'badge-wisdom',
    title: '求知猫头鹰',
    icon: '🦉',
    color: 'text-indigo-500',
    bgGradient: 'from-indigo-100 to-indigo-200',
    philosophy: '智慧与理性探索 (Wisdom)',
    philosophyDesc: '不仅是知识的积累，更是保持好奇心、运用理性去思考“为什么”。',
    condition: '你今天问了一个很棒的问题，并且用自己的方式解开了一个谜题。',
    keywords: ['阅读', '看书', '为什么', '思考', '聪明', '学习', '探索']
  },
  {
    id: 'badge-autonomy',
    title: '独立小船长',
    icon: '⚓',
    color: 'text-cyan-500',
    bgGradient: 'from-cyan-100 to-cyan-200',
    philosophy: '自我主体性 (Subjectivity)',
    philosophyDesc: '认识到“我”是自己人生的主人，能够独立思考、做选择并为之负责。',
    condition: '今天你没有等大人提醒，自己决定并安排了重要的事情。',
    keywords: ['独立', '自己做', '自理', '主动', '负责人', '乖乖']
  },
  {
    id: 'badge-justice',
    title: '公正小天平',
    icon: '⚖️',
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-100 to-emerald-200',
    philosophy: '正义与公平 (Justice)',
    philosophyDesc: '理解规则的意义，有同理心，保护弱者，实现真正的公平对待。',
    condition: '你今天与他人公平分享，或者在游戏中极好地遵守了规则。',
    keywords: ['分享', '公平', '帮助', '帮忙', '同理心', '体谅', '照顾']
  },
  {
    id: 'badge-vitality',
    title: '活力小太阳',
    icon: '☀️',
    color: 'text-rose-500',
    bgGradient: 'from-rose-100 to-rose-200',
    philosophy: '酒神精神 (Dionysian Spirit)',
    philosophyDesc: '对生命的狂热赞美，拥抱甚至享受混乱与不完美，充满创造力。',
    condition: '你完全沉浸在自己的兴趣中，遇到挫败也能笑一笑发明新的玩法！',
    keywords: ['创造', '画画', '积木', '开心', '笑', '乐观', '坚持']
  }
];

export const getMatchingBadge = (text: string): BadgeDef | null => {
  for (const badge of BADGE_DEFINITIONS) {
    if (badge.keywords && badge.keywords.some(kw => text.includes(kw))) {
      return badge;
    }
  }
  return null;
};