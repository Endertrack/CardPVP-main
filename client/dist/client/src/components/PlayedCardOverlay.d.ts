import { ReactNode } from 'react';
import { CardDef } from '@shared/types';
type OverlayVariant = 'self' | 'opponent' | 'discard';
interface Props {
    card: CardDef;
    playerName: string;
    variant?: OverlayVariant;
    children?: ReactNode;
}
export default function PlayedCardOverlay({ card, playerName, variant, children }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=PlayedCardOverlay.d.ts.map