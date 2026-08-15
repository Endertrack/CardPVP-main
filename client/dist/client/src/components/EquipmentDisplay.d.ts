import { CardDef } from '@shared/types';
interface Props {
    equipment: {
        equip?: CardDef;
        weapon?: CardDef;
        field?: CardDef;
    };
    isOpponent?: boolean;
    onUnequip?: (slot: string) => void;
}
export default function EquipmentDisplay({ equipment, isOpponent, onUnequip }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=EquipmentDisplay.d.ts.map