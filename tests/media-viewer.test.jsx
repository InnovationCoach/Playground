// @vitest-environment jsdom
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach, afterEach, describe, it, expect, vi} from 'vitest';
import {MediaImage, MediaVideo, mediaKind} from '../src/features/media/MediaViewer.jsx';
import {LearningMedia} from '../src/features/school/media/LearningMedia.jsx';
let host, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  HTMLDialogElement.prototype.showModal = function () {this.open = true;};
  HTMLDialogElement.prototype.close = function () {this.open = false;};
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT;});
const render = async node => act(async () => root.render(node));
const click = async node => act(async () => node.click());
describe('Shared learning media', () => {
  it('recognizes legacy filenames and signed URLs without mistaking PDF for video', () => {
    expect(mediaKind({name:'lesson.MP4'})).toBe('video');
    expect(mediaKind({contentType:'application/octet-stream', url:'https://example.test/o/class%2Fclip.webm?token=test'})).toBe('video');
    expect(mediaKind({name:'poster.png'})).toBe('image');
    expect(mediaKind({contentType:'application/pdf',name:'brief.pdf'})).toBe('file');
  });
  it('opens the source image by keyboard, shows original pixels and restores focus', async () => {
    await render(<MediaImage src="/original.png" alt="City model"/>);
    const trigger = host.querySelector('img'); trigger.focus();
    await act(async () => trigger.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
    const dialog = document.querySelector('dialog'); expect(dialog.open).toBe(true);
    const image = dialog.querySelector('img');
    Object.defineProperty(image,'naturalWidth',{value:2000}); Object.defineProperty(image,'naturalHeight',{value:1200});
    await act(async () => image.dispatchEvent(new Event('load',{bubbles:true})));
    await click(Array.from(dialog.querySelectorAll('button')).find(b=>b.textContent==='Original size'));
    expect(image.style.width).toBe('2000px'); expect(image.getAttribute('src')).toBe('/original.png');
    await click(dialog.querySelector('[aria-label="Close image viewer"]'));
    expect(document.querySelector('dialog')).toBeNull(); expect(document.activeElement).toBe(trigger);
  });
  it('closes the viewer on Escape cancellation', async () => {
    await render(<MediaImage src="/photo.png" alt="Evidence"/>); await click(host.querySelector('img'));
    await act(async () => document.querySelector('dialog').dispatchEvent(new Event('cancel',{bubbles:true,cancelable:true})));
    expect(document.querySelector('dialog')).toBeNull();
  });
  it('reports inaccessible images without hiding the close control', async () => {
    await render(<MediaImage src="/missing.png" alt="Evidence"/>); await click(host.querySelector('img'));
    await act(async () => document.querySelector('dialog img').dispatchEvent(new Event('error')));
    expect(document.querySelector('[role="alert"]').textContent).toContain('could not be loaded');
    expect(document.querySelector('[aria-label="Close image viewer"]')).not.toBeNull();
  });
  it('offers controls, inline playback, captions, speed and retry for failed video', async () => {
    await render(<MediaVideo src="/clip.mp4" title="Energy" tracks={[{src:'/captions.vtt',srcLang:'en',label:'English'}]}/>);
    const video = host.querySelector('video'); expect(video.controls).toBe(true); expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.autoplay).toBe(false); expect(video.querySelector('track').getAttribute('kind')).toBe('captions');
    const speed = host.querySelector('select'); speed.value='1.5';
    await act(async () => speed.dispatchEvent(new Event('change',{bubbles:true})));
    expect(video.playbackRate).toBe(1.5);
    await act(async () => video.dispatchEvent(new Event('error')));
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    await click(host.querySelector('button')); expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.querySelector('video')).not.toBe(video);
    await act(async () => host.querySelector('video').dispatchEvent(new Event('loadedmetadata')));
    expect(host.querySelector('video').playbackRate).toBe(1.5);
  });
  it('renders a player for legacy resources and preserves document links', async () => {
    await render(<LearningMedia attachments={[{name:'clip.mp4',url:'/clip.mp4'},{name:'poster.png',url:'/poster.png'},{name:'brief.pdf',contentType:'application/pdf',url:'/brief.pdf'}]}/>);
    expect(host.querySelector('video').controls).toBe(true);
    expect(host.querySelector('img[role="button"]')).not.toBeNull(); expect(host.querySelector('a').getAttribute('href')).toBe('/brief.pdf');
  });
});
