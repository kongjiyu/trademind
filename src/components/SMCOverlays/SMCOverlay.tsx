'use client';

// SMC Overlay component - simplified for MVP
// Full overlay rendering will be implemented in v1.0

import { useChartStore } from '@/lib/store';

export default function SMCOverlay() {
  const { orderBlocks, fairValueGaps, liquidityZones } = useChartStore();

  // Overlays are tracked in state
  // Chart rendering handles the actual visual display
  // This component can be extended for interactive overlays

  return null;
}

// Utility to get current SMC levels summary
export function getSMCLevelCount() {
  const state = useChartStore.getState();
  return {
    orderBlocks: state.orderBlocks.length,
    fvgs: state.fairValueGaps.length,
    liquidityZones: state.liquidityZones.length,
    signals: state.signals.length,
  };
}