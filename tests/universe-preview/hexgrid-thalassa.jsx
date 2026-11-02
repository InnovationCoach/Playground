import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectHexGrid } from '../../src/features/activities/hexGrid/ProjectHexGrid.jsx';

// Hex-Grid opened the way a My Universe workstation opens it, with Firebase replaced by an offline stub.
createRoot(document.getElementById('root')).render(<ProjectHexGrid uid={null} scenario="thalassa-station" onExit={() => { location.href = './explorer.html'; }} />);
