import * as THREE from 'three';
import { HandPose } from '../core/types';

export interface RendererOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  showDebugSkeleton?: boolean;
  showRiggedMesh?: boolean;
  centerCamera?: boolean;
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17] // Wrist to pinky base
];

class HandVisualization {
  public group: THREE.Group = new THREE.Group();
  private joints: THREE.Mesh[] = [];
  private bones: THREE.Mesh[] = [];
  
  // A simple procedural mesh placeholder for the rigged mesh
  public riggedMeshPlaceholder: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene, private showDebugSkeleton: boolean, private showRiggedMesh: boolean) {
    this.initGroup(scene);
    this.initDebugSkeleton();
    this.initRiggedMeshPlaceholder();
  }

  private initGroup(scene: THREE.Scene) {
    scene.add(this.group);
  }

  private initDebugSkeleton() {
    // 1. Debug Skeleton View
    const jointGeo = new THREE.SphereGeometry(0.02, 16, 16);
    const jointMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    for (let i = 0; i < 21; i++) {
      const joint = new THREE.Mesh(jointGeo, jointMat);
      joint.visible = this.showDebugSkeleton;
      this.joints.push(joint);
      this.group.add(joint);
    }
    
    const boneGeo = new THREE.CylinderGeometry(0.01, 0.01, 1, 8);
    // Move origin to base for easy rotation scaling
    boneGeo.translate(0, 0.5, 0); 
    boneGeo.rotateX(Math.PI / 2);
    const boneMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    for (let i = 0; i < CONNECTIONS.length; i++) {
      const bone = new THREE.Mesh(boneGeo, boneMat);
      bone.visible = this.showDebugSkeleton;
      this.bones.push(bone);
      this.group.add(bone);
    }
  }

  private initRiggedMeshPlaceholder() {
    // 2. Rigged Mesh View Placeholder
    // For v0.2.0, we use procedural placeholder cubes that follow the hand tracking 
    // until a full skinning/rigging approach is added with a GLTF model.
    this.riggedMeshPlaceholder = new THREE.Group();
    this.group.add(this.riggedMeshPlaceholder);
    
    // We'll create basic block "bones" as placeholders for the rigged hand mesh
    const placeholderMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
    const placeholderGeo = new THREE.BoxGeometry(0.03, 0.03, 1);
    placeholderGeo.translate(0, 0, 0.5);

    for (let i = 0; i < CONNECTIONS.length; i++) {
      const boneGroup = new THREE.Mesh(placeholderGeo, placeholderMat);
      boneGroup.visible = this.showRiggedMesh;
      this.riggedMeshPlaceholder.add(boneGroup);
    }
  }

  update(pose: HandPose) {
    this.group.visible = true;
    const kps = pose.keypoints3D || pose.keypoints;
    console.log(kps);
    if (!kps) return;

    // Scale down from typical pixel/large coords to roughly meters for ThreeJS 
    // (assuming MediaPipe outputs coords in roughly 1/1000 scale if normalized, or pixel scale. 
    // Usually MediaPipe 3D keypoints are in meters relative to wrist if keypoints3D is used.)
    const scale = 10.0; 

    // Update Joints
    for (let i = 0; i < 21; i++) {
      const kp = kps[i];
      if (!kp) continue;
      this.joints[i].position.set(
        (kp.x || 0) * scale,
        -(kp.y || 0) * scale,
        -(kp.z || 0) * scale
      );
    }

    // Update Bones & Rigged Placeholders
    for (let i = 0; i < CONNECTIONS.length; i++) {
      const [startIdx, endIdx] = CONNECTIONS[i];
      const startKP = this.joints[startIdx].position;
      const endKP = this.joints[endIdx].position;

      const distance = startKP.distanceTo(endKP);
      
      // Update Debug Bone
      const bone = this.bones[i];
      bone.position.copy(startKP);
      bone.lookAt(endKP);
      bone.scale.set(1, 1, distance);

      // Update Rigged Placeholder
      const rigBone = this.riggedMeshPlaceholder.children[i] as THREE.Mesh;
      rigBone.position.copy(startKP);
      rigBone.lookAt(endKP);
      rigBone.scale.set(1, 1, distance);
    }
  }

  hide() {
    this.group.visible = false;
  }
  
  setDisplayMode(showDebug: boolean, showRigged: boolean) {
    this.showDebugSkeleton = showDebug;
    this.showRiggedMesh = showRigged;
    this.joints.forEach(j => j.visible = showDebug);
    this.bones.forEach(b => b.visible = showDebug);
    this.riggedMeshPlaceholder.children.forEach(b => b.visible = showRigged);
  }
}

export class HandMeshRenderer {
  private options: RendererOptions;
  private handVisualizations: HandVisualization[] = [];

  constructor(options: RendererOptions) {
    this.options = { showDebugSkeleton: true, showRiggedMesh: false, centerCamera: true, ...options };
  }

  update(handPoses: HandPose[]): void {
    // Ensure we have enough visualizers for the hands
    while (this.handVisualizations.length < handPoses.length) {
      this.handVisualizations.push(
        new HandVisualization(this.options.scene, this.options.showDebugSkeleton!, this.options.showRiggedMesh!)
      );
    }

    // Update detected hands
    for (let i = 0; i < handPoses.length; i++) {
      this.handVisualizations[i].update(handPoses[i]);
    }

    // Hide extra visualizers
    for (let i = handPoses.length; i < this.handVisualizations.length; i++) {
      this.handVisualizations[i].hide();
    }

    // Center camera on the first detected hand
    if (this.options.centerCamera && handPoses.length > 0) {
      const kps = handPoses[0].keypoints3D || handPoses[0].keypoints;
      if (kps && kps.length > 0) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const kp of kps) {
          const x = kp.x || 0;
          const y = -(kp.y || 0); // match renderer y inversion
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }

        // Scale coordinates by 10 to match renderer
        const scale = 10.0;
        const centerX = ((minX + maxX) / 2) * scale;
        const centerY = ((minY + maxY) / 2) * scale;
        
        // Smoothly interpolate camera position to center of hand
        this.options.camera.position.x += (centerX - this.options.camera.position.x) * 0.1;
        this.options.camera.position.y += (centerY - this.options.camera.position.y) * 0.1;
      }
    }
  }

  hide(): void {
    for (const vis of this.handVisualizations) {
      vis.hide();
    }
  }

  setDisplayMode(showDebug: boolean, showRigged: boolean): void {
    this.options.showDebugSkeleton = showDebug;
    this.options.showRiggedMesh = showRigged;
    for (const vis of this.handVisualizations) {
      vis.setDisplayMode(showDebug, showRigged);
    }
  }
}
