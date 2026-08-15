import { PlayerState } from '@shared/types';
interface Props {
    player: PlayerState;
    isOpponent?: boolean;
    className?: string;
    onAvatarClick?: () => void;
}
export default function PlayerInfo({ player, isOpponent, className, onAvatarClick }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=PlayerInfo.d.ts.map