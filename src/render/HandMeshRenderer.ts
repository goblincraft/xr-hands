export interface RendererOptions {
  scene: any; // Will use THREE.Scene later
  camera: any; // Will use THREE.Camera later
  showDebugSkeleton?: boolean;
}

export class HandMeshRenderer {
  constructor(options: RendererOptions) {
    // Initialization will be implemented in v0.2.0
  }

  update(handPoses: any[]): void {
    // Updates 3D meshes based on ML predictions
  }

  hide(): void {
    // Hide hands
  }
}
