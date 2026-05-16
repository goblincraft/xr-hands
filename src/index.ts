import { HandTracker } from './core/HandTracker';
import { HandMeshRenderer } from './render/HandMeshRenderer';
import { setupThreeScene } from './utils/ThreeUtils';
import { setupVideo, setupCanvas, setupCanvasContext } from './utils/DOMUtils';

export { HandTracker };
export type { TrackerOptions } from './core/HandTracker';
export type { HandPose, Keypoint3D } from './core/types';
export { HandMeshRenderer };
export type { RendererOptions } from './render/HandMeshRenderer';

export async function XRHands() {
  const video = setupVideo();
  const canvas = setupCanvas();
  const tracker = new HandTracker({
    videoElement: video,
    inputElement: canvas,
    maxHands: 2,
    modelType: 'lite'
  });

  await tracker.init();
  console.log('Hand tracker initialized');
  
  const ctx = setupCanvasContext(canvas, video);

  const { scene, camera, renderer } = setupThreeScene();

  // Initialize HandMeshRenderer
  const handRenderer = new HandMeshRenderer({
    scene,
    camera,
    showDebugSkeleton: true,
    showRiggedMesh: false
  });

  let isTrackingPaused = false;

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Render Loop
  async function animate() {
    requestAnimationFrame(animate);

    try {
      if (!isTrackingPaused) {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        const poses = await tracker.estimateHands(); 
        if (poses.length > 0) {
          handRenderer.update(poses);
        } else {
          handRenderer.hide();
        }
      }
    } catch (e) {
      console.error(e);
    }

    renderer.render(scene, camera);
  }

  animate();

  return {
    handRenderer,
    setTrackingPaused: (paused: boolean) => {
      isTrackingPaused = paused;
    }
  };
}
