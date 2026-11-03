import React from 'react';
import {createRoot} from 'react-dom/client';
import {LearningMedia} from '../../src/features/school/media/LearningMedia.jsx';
import '../../src/features/school/schoolWorkspace.css';
createRoot(document.getElementById('root')).render(<main style={{maxWidth:900,margin:'auto',padding:24,fontFamily:'system-ui'}}>
<p>Isolated media preview · Sample resources only · No account connection or real saves</p>
<h1>Explore your learning resources</h1><p>Select the image to inspect its original size. Video controls are available to every authorized viewer.</p>
<LearningMedia attachments={[
{name:'Sustainable Futures poster',contentType:'image/svg+xml',url:'/tests/school-preview/program-poster.svg'},
{name:'Unavailable sample video.mp4',url:'/tests/media-preview/unavailable.mp4'},
{name:'Project introduction.pdf',contentType:'application/pdf',url:'/tests/school-preview/sample-slides.pdf'}]}/>
</main>);
