import React,{useEffect,useRef} from 'react';
import {FirstContact} from './FirstContact.jsx';
import {useDialogFocus} from '../pilot/dialogFocus.js';
export default function FirstContactJourney({onClose}){
 const root=useRef(null),close=useRef(null),keys=useDialogFocus(root,onClose,close);
 useEffect(()=>{close.current?.focus();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[]);
 return <div ref={root} className="fc-journey-overlay" role="dialog" aria-modal="true" aria-label="My Universe ship and base expedition" onKeyDownCapture={keys}><div className="fc-journey-top"><span>MY UNIVERSE · SHIP & BASE EXPEDITIONS</span><button ref={close} onClick={onClose}>Close expedition</button></div><FirstContact inline/></div>;
}
