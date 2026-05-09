import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { HandPose } from './types';

export interface TrackerOptions {
  videoElement: HTMLVideoElement;
  inputElement?: HTMLVideoElement | HTMLCanvasElement;
  maxHands?: number;
  modelType?: 'lite' | 'full';
}

export class HandTracker {
  private options: TrackerOptions;
  private detector: handPoseDetection.HandDetector | null = null;
  private stream: MediaStream | null = null;

  constructor(options: TrackerOptions) {
    this.options = options;
  }

  async init(): Promise<void> {
    // Request webcam permissions and attach stream
    this.stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      } 
    });
    this.options.videoElement.srcObject = this.stream;
    
    await new Promise<void>((resolve) => {
      this.options.videoElement.onloadeddata = () => {
        this.options.videoElement.play();
        resolve();
      };
    });

    // Instantiate hand pose detector
    await tf.ready();
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
      runtime: 'tfjs',
      modelType: this.options.modelType || 'lite',
      maxHands: this.options.maxHands || 1
    };
    
    this.detector = await handPoseDetection.createDetector(model, detectorConfig);
  }

  async estimateHands(): Promise<HandPose[]> {
    if (!this.detector) {
      throw new Error('HandTracker is not initialized. Please call init() first.');
    }
    const input = this.options.inputElement || this.options.videoElement;
    const hands = await this.detector.estimateHands(input);
    return hands.map(hand => ({
      keypoints: hand.keypoints.map(kp => ({
        x: kp.x,
        y: kp.y,
        z: kp.z,
        name: kp.name
      })),
      keypoints3D: hand.keypoints3D?.map(kp => ({
        x: kp.x,
        y: kp.y,
        z: kp.z,
        name: kp.name
      })),
      score: hand.score ?? 0,
      handedness: hand.handedness as 'Left' | 'Right'
    }));
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
  }
}
