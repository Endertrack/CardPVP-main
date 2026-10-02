import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore, NICKNAME_MAX_LENGTH } from '../store/settingsStore';
import { useIsLandscape } from '../hooks/useOrientation';
import { displayMessage } from '../store/notificationStore';
import { RoleEntryBtn, RolePanel } from '../components/RoleWidgets';
import CollectionModal from '../components/CollectionModal';
import { useT } from '../i18n/i18n';

export default function WaitingRoom() {
  const t = useT();
  const { leaveRoom, updateName } = useSocket();
  const { player } = useGameStore();
  const gameState = useGameStore((s) => s.gameState);
  // 匹配成功（对手加入、进入对局）时立即关闭本页帮助/图鉴弹窗
  useEffect(() => {
    if (gameState) setShowCollection(false);
  }, [gameState]);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const isLandscape = useIsLandscape();

  const roomId = player?.roomId ?? '';
  const [nickName, setNickName] = useState(player?.name ?? '');
  const [copied, setCopied] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  // 兼容移动端的复制：先试 Clipboard API，失败则回退 execCommand
  const copyText = async (text: string): Promise<boolean> => {
    // 现代API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch { /* 继续回退 */ }
    }
    // 回退：隐藏 textarea + execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  // 分享链接（复制 ?room= 链接）
  const handleShareLink = async () => {
    const url = `${window.location.origin}?room=${roomId}`;
    const ok = await copyText(url);
    if (ok) {
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    } else {
      displayMessage(t('复制失败，请手动选中复制', 'Copy failed, please copy manually'));
    }
  };

  // 昵称修改：失焦时同步服务端
  const handleNameBlur = async () => {
    const trimmed = nickName.trim();
    if (!trimmed || trimmed === player?.name) return;
    setNameSaving(true);
    const result = await updateName(trimmed);
    setNameSaving(false);
    if (!result.success) {
      displayMessage(result.error || t('昵称更新失败', 'Failed to update nickname'));
    } else {
      // 与「设置」中的昵称保持同步，下次创建/加入房间直接复用
      setNickname(trimmed);
    }
  };

  // 取消匹配 → 返回房间列表（沿用现有离开房间逻辑）
  const handleCancel = () => {
    leaveRoom();
    useGameStore.getState().setPage('roomList');
  };

  // 昵称输入（与「设置」中的昵称同一份展示，失焦同步服务端）
  const NameInput = (
    <div className="relative flex-1 min-w-0">
      <input
        type="text"
        placeholder={t('输入昵称', 'Nickname')}
        value={nickName}
        onChange={(e) => setNickName(e.target.value)}
        onBlur={handleNameBlur}
        maxLength={NICKNAME_MAX_LENGTH}
        className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent-shield/50 transition-colors"
      />
      {nameSaving && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">{t('保存中...', 'Saving...')}</span>
      )}
    </div>
  );

  // 图鉴与规则按钮（打开统一弹窗：规则 | 卡牌 | 状态）
  const GalleryBtn = (
    <button
      onClick={() => setShowCollection(true)}
      className="w-full py-2.5 rounded-xl bg-accent-shield/15 border border-accent-shield/25 text-accent-shield text-sm font-semibold hover:bg-accent-shield/25 transition-colors disabled:opacity-40"
    >
      📖 {t('图鉴与规则', 'Gallery & Rules')}
    </button>
  );

  // 取消匹配按钮（红色警示，沿用原取消匹配样式）
  const CancelBtn = (
    <button
      onClick={handleCancel}
      className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors active:scale-95"
    >
      ✕ {t('取消匹配', 'Cancel Match')}
    </button>
  );

  // 分享按钮：竖屏右上角（缩小宽度，文案「分享」）/ 横屏放房间码下方（文案「分享链接」）
  const ShareBtn = isLandscape ? (
    <button
      onClick={handleShareLink}
      className="px-6 py-2 rounded-xl bg-card-bg border border-card-border text-text-secondary text-sm hover:text-accent-shield hover:border-accent-shield/30 transition-colors active:scale-95"
    >
      {copied === 'link' ? '✓ ' + t('已复制', 'Copied') : '🔗 ' + t('分享链接', 'Share link')}
    </button>
  ) : (
    <button
      onClick={handleShareLink}
      className="shrink-0 px-3 py-2 rounded-xl bg-card-bg border border-card-border text-text-secondary text-xs hover:text-accent-shield hover:border-accent-shield/30 transition-colors active:scale-95"
    >
      {copied === 'link' ? '✓ ' + t('已复制', 'Copied') : '🔗 ' + t('分享', 'Share')}
    </button>
  );

  // 左侧：LOGO + 房间号 + 等待文本（竖屏标题放顶栏，横屏标题保留在此）
  const LeftBlock = (
    <div className="flex flex-col items-center animate-fade-in">
      <img src="/assets/connect.png" alt="" className="w-20 h-20 mb-5 drop-shadow-lg" />
      {isLandscape && (
        <h1 className="text-2xl font-bold text-text-primary mb-4">{t('等待对手加入', 'Waiting for opponent')}</h1>
      )}
      <div className="bg-card-bg border border-card-border rounded-2xl px-8 py-5 mb-5">
        <p className="text-text-secondary text-xs mb-1 text-center">{t('房间码', 'Room code')}</p>
        <p className="text-4xl font-bold tracking-[0.3em] text-accent-shield text-center">{roomId}</p>
      </div>
      {isLandscape && <div className="mb-5">{ShareBtn}</div>}
      {/* 等待动画 */}
      <div className="flex justify-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-accent-shield animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-accent-shield animate-bounce" style={{ animationDelay: '0.2s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-accent-shield animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );

  if (isLandscape) {
    // ===== 横屏：大分辨率下按 16:9 固定比例居中显示（小屏自动占满），左侧房间信息 + 右侧上角色选择栏 / 下操作栏 =====
    return (
      <>
        <div className="h-viewport flex items-center justify-center bg-page-bg p-4">
        <div className="w-full h-full max-w-[960px] max-h-[540px] flex rounded-2xl border border-card-border/50 bg-card-bg/40 overflow-hidden shadow-xl">
          <div className="flex-[3] min-w-0 flex items-center justify-center px-6 overflow-y-auto">
            {LeftBlock}
          </div>
          <div className="flex-[2] min-w-0 border-l border-card-border/30 flex flex-col overflow-hidden">
            <RolePanel />
            <div className="flex-1 flex flex-col justify-center gap-2.5 px-4 py-3 min-h-0 overflow-y-auto">
              {NameInput}
              {GalleryBtn}
              {CancelBtn}
              <p className="text-center text-text-secondary text-xs mt-1">
                {t('将房间码或链接发送给好友即可对战', 'Send the code or link to a friend to start a battle')}
              </p>
            </div>
          </div>
        </div>
        </div>
        {showCollection && <CollectionModal onClose={() => setShowCollection(false)} />}
      </>
    );
  }

  // ===== 竖屏：右上角分享 + 底部三行固定操作栏（沿用房间列表布局） =====
  return (
    <>
      <div className="h-viewport flex flex-col bg-page-bg">
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-card-border/30 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-text-primary shrink-0">{t('等待对手加入', 'Waiting for opponent')}</h1>
          {ShareBtn}
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-6">
          {LeftBlock}
          <p className="text-center text-text-secondary text-xs mt-1">
            {t('将房间码或链接发送给好友即可对战', 'Send the code or link to a friend to start a battle')}
          </p>
        </div>
        <div className="shrink-0 px-4 py-3 border-t border-card-border/30 bg-card-bg/30">
          <div className="space-y-2">
            <RoleEntryBtn />
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">{NameInput}</div>
              <div className="flex-1 min-w-0">{GalleryBtn}</div>
            </div>
            {CancelBtn}
          </div>
        </div>
      </div>
      {showCollection && <CollectionModal onClose={() => setShowCollection(false)} />}
    </>
  );
}
