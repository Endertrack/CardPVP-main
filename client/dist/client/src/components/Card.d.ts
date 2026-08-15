import { CardDef } from '@shared/types';
interface Props {
    card: CardDef;
    compact?: boolean;
    disabled?: boolean;
    selected?: boolean;
    onClick?: () => void;
    hidden?: boolean;
    played?: boolean;
}
export default function Card({ card, compact, disabled, selected, onClick, hidden, played }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=Card.d.ts.map