import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CourseDiscovery } from '../../src/features/courses/CourseDiscovery.jsx';
import { discoverySample } from './discoveryFixtures.js';

function Preview() {
  const [selected, setSelected] = useState(false);
  return <CourseDiscovery {...discoverySample} recommendations={discoverySample.recommendations.filter(r => !selected || !r.recommendationId)} name="Alex" preview externalAvailable
    onChooseQuest={async () => setSelected(true)} />;
}
createRoot(document.getElementById('root')).render(<Preview />);
