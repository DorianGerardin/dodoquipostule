import './styles/base.css';
import './styles/layout.css';
import './styles/viewer.css';
import './styles/player.css';
import './styles/logo.css';

import { Viewer } from './three/Viewer.js';
import { VIEWER_CONFIG } from './config.js';

const container = document.getElementById('viewer');
if (container) {
  new Viewer(container, VIEWER_CONFIG).init();
}