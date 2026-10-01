import { useState } from 'react';
import { CardCollectionContent } from './CardCollection';
import { BuffCollectionContent } from './BuffCollection';
import { RulesContent } from './RulesModal';
import { useT } from '../i18n/i18n';

type Tab = 'rules' | 'cards' | 'buffs';

interface CollectionModalProps {
  onClose: () => void;
  /** 初始 Tab（如从主大厅「规则」按钮进入时传 'rules'），默认卡牌 */
  initialTab?: Tab;
}

/** 统一的图鉴/规则弹窗：规则 | 卡牌 | 状态 三个 Tab */
export default function CollectionModal({ onClose, initialTab = 'cards' }: CollectionModalProps) {
  const t = useT();
  const [tab, setTab] = useState<Tab>(initialTab);

  const tabBtn = (key: Tab, icon: string, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
        tab === key
          ? 'bg-accent-shield/20 text-accent-shield'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl animate-fade-in my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题 + Tab 切换 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {tabBtn('rules', '📋', t('规则', 'Rules'))}
            {tabBtn('cards', '🃏', t('卡牌', 'Cards'))}
            {tabBtn('buffs', '✨', t('状态', 'Effects'))}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-card-border flex items-center justify-center text-text-secondary hover:bg-card-bg/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容区 */}
        {tab === 'rules' ? <RulesContent /> : tab === 'cards' ? <CardCollectionContent /> : <BuffCollectionContent />}
      </div>
    </div>
  );
}
