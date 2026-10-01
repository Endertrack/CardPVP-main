import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore, normalizeNickname, RECENT_CHANGES } from '../store/settingsStore';
import { useIsLandscape } from '../hooks/useOrientation';
import CollectionModal from '../components/CollectionModal';
import SettingsModal from '../components/SettingsModal';
import NicknameModal from '../components/NicknameModal';
import { useT } from '../i18n/i18n';

export default function Lobby() {
  const t = useT();
  const { connected } = useGameStore();
  const nickname = useSettingsStore((s) => s.nickname);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const isLandscape = useIsLandscape();
  // 图鉴/规则统一弹窗：记录打开时的初始 Tab（规则 | 卡牌 | 状态）
  const [collectionTab, setCollectionTab] = useState<'rules' | 'cards' | 'buffs'>('cards');
  const [showCollection, setShowCollection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // 未设置昵称时点击「开始」弹出的创建昵称提示
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);

  const handleStart = () => {
    // 没有昵称先提示创建，创建成功后再进入房间列表
    if (!normalizeNickname(nickname)) {
      setShowNicknamePrompt(true);
      return;
    }
    useGameStore.getState().setPage('roomList');
  };

  // 创建昵称并进入房间列表
  const handleNicknameConfirm = (name: string) => {
    setNickname(name);
    setShowNicknamePrompt(false);
    useGameStore.getState().setPage('roomList');
  };

  const currentNickname = normalizeNickname(nickname);

  // 按钮公共样式
  const btnBase = 'w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';

  // 左侧 Logo + 文本
  const LogoBlock = (
    <div className="flex flex-col items-center animate-fade-in">
      <img src="https://sfile.chatglm.cn/workspace/image/b5/b5d1a9c7da.png" alt="" className="w-28 h-28 mb-4 drop-shadow-lg" />
      <h1 className="text-4xl font-bold text-gradient">CardPVP</h1>
      <div className="self-center">
        <p className="text-text-secondary mt-2 text-lg">{t('线上卡牌对战', 'Online Card Battle')}</p>
        {/* 当前昵称（未设置时提示点击开始创建），位于「线上卡牌对战」下方靠左 */}
        <p className="text-xs text-text-secondary/70 mt-1">
          {currentNickname
            ? `${t('昵称', 'Nickname')}：${currentNickname}`
            : t('尚未设置昵称，点击开始创建', 'No nickname yet — click Start to create one')}
        </p>
      </div>
    </div>
  );

  // 右侧 3 个按钮
  const ButtonBlock = (
    <div className={`flex flex-col gap-4 ${isLandscape ? 'w-72' : 'w-full max-w-xs mx-auto'}`}>
      <button
        onClick={handleStart}
        disabled={!connected}
        className={`${btnBase} bg-accent-shield/20 border-2 border-accent-shield/40 text-accent-shield hover:bg-accent-shield/30 hover:border-accent-shield/60 shadow-lg shadow-accent-shield/10`}
      >
        ⚔️ {t('开始', 'Start')}
      </button>
      <button
        onClick={() => { setCollectionTab('rules'); setShowCollection(true); }}
        className={`${btnBase} bg-card-bg border-2 border-card-border text-text-primary hover:border-accent-shield/30 hover:bg-card-bg/80`}
      >
        📖 {t('帮助', 'Help')}
      </button>
      <button
        onClick={() => setShowSettings(true)}
        className={`${btnBase} bg-card-bg border-2 border-card-border text-text-primary hover:border-accent-shield/30 hover:bg-card-bg/80`}
      >
        ⚙️ {t('设置', 'Settings')}
      </button>
    </div>
  );

  return (
    <div className="min-h-viewport flex items-center justify-center p-6">
      {isLandscape ? (
        <div className="flex items-center justify-center gap-16 w-full max-w-3xl">
          {LogoBlock}
          {ButtonBlock}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-10 w-full">
          {LogoBlock}
          {ButtonBlock}
        </div>
      )}

      {/* 弹窗 */}
      {showCollection && (
        <CollectionModal initialTab={collectionTab} onClose={() => setShowCollection(false)} />
      )}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
      {showNicknamePrompt && (
        <NicknameModal
          initial={nickname}
          title={t('创建昵称', 'Create nickname')}
          desc={t('还没有昵称，先创建一个吧，创建房间时会使用它。', 'No nickname yet — create one first; it will be used when you create a room.')}
          confirmText={t('保存并开始', 'Save & Start')}
          onConfirm={handleNicknameConfirm}
          onClose={() => setShowNicknamePrompt(false)}
        />
      )}

      {/* 左下角最近更改文本（内容见 settingsStore.ts 的 RECENT_CHANGES） */}
      <p className="fixed bottom-4 left-4 text-xs text-text-secondary/60 max-w-[45vw] pointer-events-none select-none">
        {RECENT_CHANGES}
      </p>
    </div>
  );
}
