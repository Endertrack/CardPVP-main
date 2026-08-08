import { CardDef } from '@shared/types';
interface Props {
    card: CardDef;
    isMyTurn: boolean;
    pending: boolean;
    isExhausted: (card: CardDef) => boolean;
    hasBrew: boolean;
    onPlayOnOpponent: () => void;
    onPlayOnSelf: () => void;
    onDiscard: () => void;
    onDeselect: () => void;
    onBrewConvert?: () => void;
}
export default function CardActionPanel({ card, isMyTurn, pending, isExhausted, hasBrew, onPlayOnOpponent, onPlayOnSelf, onDiscard, onDeselect, onBrewConvert, }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=CardActionPanel.d.ts.map