import { XRHands } from '../src/index';

async function setupDemo() {
  const { handRenderer, setTrackingPaused } = await XRHands();

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
    setTrackingPaused(isTrackingPaused);
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
}

setupDemo().catch(console.error);
