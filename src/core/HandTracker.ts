export interface TrackerOptions {
  videoElement: HTMLVideoElement;
  maxHands?: number;
  modelType?: 'lite' | 'full';
}

export class HandTracker {
  constructor(options: TrackerOptions) {
    // Initialization will be implemented in v0.1.0
  }

  async init(): Promise<void> {
    // TF.js and model initialization
  }

  async estimateHands(): Promise<any[]> {
    // Implementation for hand pose estimation
    return [];
  }

  stop(): void {
    // Cleanup
  }
}
