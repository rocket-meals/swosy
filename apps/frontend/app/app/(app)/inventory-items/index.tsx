import React from 'react';
import { Redirect } from 'expo-router';

/**
 * `inventory-items` is listed in `AppScreens`, so the route tools (screenshot
 * generator, accessibility tester) open it without an id. The actual list lives
 * in the experimental area while the feature matures; only the QR-code target
 * `inventory-items/details?id=…` is a stable route.
 */
export default function InventoryItemsIndex() {
	return <Redirect href="/(app)/experimentell/inventory-items" />;
}
