export interface Keypoint3D {
  x: number;
  y: number;
  z?: number;
  name?: string;
}

export interface HandPose {
  keypoints: Keypoint3D[];
  keypoints3D?: Keypoint3D[];
  score: number;
  handedness?: 'Left' | 'Right';
}
