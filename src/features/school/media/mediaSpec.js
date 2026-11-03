export const PRESENTATION_TYPES = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
export const LEARNING_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', ...PRESENTATION_TYPES];
export const MEDIA_ACCEPT = [...LEARNING_MEDIA_TYPES, '.pdf', '.ppt', '.pptx'].join(',');
export const MEDIA_HINT = 'Up to 8 files, 100 MB each. JPG, PNG, WebP, GIF, MP4, WebM, PDF, PPT or PPTX. Export slides as PDF to read them in your browser.';
export function learningMediaType(file) {
  const extension = file.name?.split('.').pop().toLowerCase();
  return file.type || ({pdf: PRESENTATION_TYPES[0], ppt: PRESENTATION_TYPES[1], pptx: PRESENTATION_TYPES[2]}[extension] || '');
}
export const MAX_PROGRAM_MEDIA_SIZE = 100 * 1024 * 1024; // 100 MB per file

export function validateMediaFiles(files, existingCount = 0) {
  if (existingCount + files.length > 8) {
    throw new Error('A maximum of 8 learning resources can be attached per program or lesson.');
  }
  for (const file of files) {
    if (!file.size || file.size <= 0) {
      throw new Error(`File "${file.name}" is empty (0 bytes). Please choose a valid file.`);
    }
    if (file.size > MAX_PROGRAM_MEDIA_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`File "${file.name}" (${mb} MB) exceeds the 100 MB limit for program materials. Please compress videos/slides or choose a file under 100 MB.`);
    }
    const type = learningMediaType(file);
    if (!LEARNING_MEDIA_TYPES.includes(type)) {
      throw new Error(`File "${file.name}" is not a supported format. Allowed formats: JPG, PNG, WebP, GIF, MP4, WebM, PDF, PPT, or PPTX.`);
    }
  }
}
