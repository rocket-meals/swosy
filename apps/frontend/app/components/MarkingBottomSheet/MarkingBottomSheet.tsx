import React, { forwardRef } from 'react';
import type BottomSheet from '@gorhom/bottom-sheet';
import { CollectibleAt } from 'repo-depkit-common';
import BaseBottomSheet from '../BaseBottomSheet';
import MenuSheet from '../MenuSheet/MenuSheet';
import { useTheme } from '@/hooks/useTheme';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';

export interface MarkingBottomSheetProps {
	onClose: () => void;
}

const MarkingBottomSheet = forwardRef<BottomSheet, MarkingBottomSheetProps>(({ onClose }, ref) => {
        const { theme } = useTheme();

        return (
                <BaseBottomSheet ref={ref} index={-1} backgroundStyle={{ backgroundColor: theme.sheet.sheetBg }} enablePanDownToClose handleComponent={null} onClose={onClose}>
                        <MenuSheet closeSheet={onClose} />
                        <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_markings_details} />
                </BaseBottomSheet>
        );
});

export default MarkingBottomSheet;
