import * as THREE from 'three';
import { HandTracker, HandMeshRenderer } from '../src/index';
import { setupThreeScene } from '../src/utils/ThreeUtils';

function setupVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.style.display = 'block';
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.zIndex = '-1';
  document.body.appendChild(video);
  return video;
}

function setupCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'cover';
  canvas.style.zIndex = '0';
  document.body.appendChild(canvas);
  return canvas;
}

function setupCanvasContext(canvas: HTMLCanvasElement, video: HTMLVideoElement): CanvasRenderingContext2D | null {
  // Match canvas internal resolution to video source
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  return canvas.getContext('2d');
}

async function init() {
  const video = setupVideo();
  const canvas = setupCanvas();
  const ctx = setupCanvasContext(canvas, video);
  const tracker = new HandTracker({
    videoElement: video,
    inputElement: canvas,
    maxHands: 2,
    modelType: 'lite'
  });

  await tracker.init();
  console.log('Hand tracker initialized');

  const { scene, camera, renderer } = setupThreeScene();

  // Initialize HandMeshRenderer
  const handRenderer = new HandMeshRenderer({
    scene,
    camera,
    showDebugSkeleton: true,
    showRiggedMesh: false
  });

  // UI for toggling view
  const controlsDiv = document.createElement('div');
  controlsDiv.style.position = 'absolute';
  controlsDiv.style.top = '20px';
  controlsDiv.style.left = '20px';
  controlsDiv.style.zIndex = '100';
  document.body.appendChild(controlsDiv);

  const toggleDebugBtn = document.createElement('button');
  toggleDebugBtn.textContent = 'Toggle Debug Skeleton';
  controlsDiv.appendChild(toggleDebugBtn);

  const toggleRiggedBtn = document.createElement('button');
  toggleRiggedBtn.textContent = 'Toggle Rigged Mesh';
  controlsDiv.appendChild(toggleRiggedBtn);

  const togglePauseBtn = document.createElement('button');
  togglePauseBtn.textContent = 'Pause Tracking';
  controlsDiv.appendChild(togglePauseBtn);

  let showDebug = true;
  let showRigged = false;
  let isTrackingPaused = false;

  togglePauseBtn.onclick = () => {
    isTrackingPaused = !isTrackingPaused;
    if (isTrackingPaused) {
      togglePauseBtn.textContent = 'Resume Tracking';
      handRenderer.hide();
    } else {
      togglePauseBtn.textContent = 'Pause Tracking';
    }
  };

  toggleDebugBtn.onclick = () => {
    showDebug = !showDebug;
    handRenderer.setDisplayMode(showDebug, showRigged);
  };

  toggleRiggedBtn.onclick = () => {
    showRigged = !showRigged;
    handRenderer.setDisplayMode(showDebug, showRigged);
  };

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

          // Center camera on the first detected hand
          const kps = poses[0].keypoints3D || poses[0].keypoints;
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
            camera.position.x += (centerX - camera.position.x) * 0.1;
            camera.position.y += (centerY - camera.position.y) * 0.1;
          }

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
}

init().catch(console.error);
