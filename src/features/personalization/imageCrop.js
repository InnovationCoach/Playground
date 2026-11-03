import {PROFILE_SPACE_STRINGS as copy} from './profileSpaceStrings.js';
/** Return an in-bounds source rectangle for a fixed-aspect image crop. */
export function cropRect(width, height, aspect, zoom = 1, x = 50, y = 50) {
  if (![width,height,aspect,zoom,x,y].every(Number.isFinite) || width <= 0 || height <= 0 || aspect <= 0) throw new Error(copy.unreadableImage);
  const scale = Math.max(1,Math.min(3,zoom));
  const baseWidth = Math.min(width,height * aspect);
  const cropWidth = baseWidth / scale, cropHeight = cropWidth / aspect;
  return {x:(width-cropWidth)*Math.max(0,Math.min(100,x))/100,y:(height-cropHeight)*Math.max(0,Math.min(100,y))/100,width:cropWidth,height:cropHeight};
}
export async function cropImage(image, rect, kind) {
  const canvas = document.createElement('canvas');
  canvas.width = kind === 'picture' ? 640 : 1600;
  canvas.height = kind === 'picture' ? 640 : 600;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(copy.cropUnavailable);
  context.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,canvas.width,canvas.height);
  const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if (!blob) throw new Error(copy.cropFailed);
  return new File([blob],kind === 'picture' ? 'profile-picture.png' : 'dashboard-banner.png',{type:'image/png'});
}
