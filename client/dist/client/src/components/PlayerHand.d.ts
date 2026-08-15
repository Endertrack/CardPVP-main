import { CardDef } from '@shared/types';
interface Props {
    cards: CardDef[];
    disabled: boolean;
    selectedCardId: string | null;
    onSelectCard: (card: CardDef) => void;
    collapsed: boolean;
    onToggle: () => void;
}
export default function PlayerHand({ cards, disabled, selectedCardId, onSelectCard, collapsed, onToggle }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=PlayerHand.d.ts.map