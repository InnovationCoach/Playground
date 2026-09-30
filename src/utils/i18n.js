/**
 * i18n Internationalization & Translation Module
 * Supports English (EN) & Thai (TH 🇹🇭) language toggling for WeLearn AI & PBL Suite.
 */

export const translations = {
  en: {
    brandTitle: "🤖 WeLearn AI & PBL Suite",
    coachPortal: "🍎 Coach Dashboard",
    homePortal: "🏠 Home Portal",
    urbanHeat: "🌴 Activity 1: Urban Heat",
    bunker: "🛡️ Activity 2: Bunker Survival",
    coding: "🐍 Activity 3: Micro:bit Coding",
    bangkok: "🌊 Activity 4: Bangkok Coastal",
    solar: "☀️ Activity 5: Solar Car",
    studentPortal: "🎒 Student Portal",
    signIn: "Sign In",
    signUp: "Sign Up",
    logout: "🚪 Logout",
    studentProgress: "📊 Student Progress",
    activitiesPosition: "🎯 Activities Position & Curriculum",
    studentGoals: "🎯 Student Goals",
    searchPlaceholder: "🔍 Search student...",
    exportReport: "📥 Export Progress Report",
    weeklyTaskTitle: "🗓️ Coach Weekly Tasks Manager",
    assignTask: "+ Assign New Weekly Task",
    feedbackTitle: "💬 Provide Coach Feedback",
    sendFeedback: "✉️ Send Feedback",
    aiTutorTitle: "🤖 Gemini AI STEM Learning Companion",
    askAi: "✨ Ask AI"
  },
  th: {
    brandTitle: "🤖 WeLearn ชุดการเรียนรู้ AI & PBL",
    coachPortal: "🍎 แดชบอร์ดครูผู้สอน",
    homePortal: "🏠 หน้าหลักพอร์ทัล",
    urbanHeat: "🌴 กิจกรรมที่ 1: เกาะความร้อนเมือง",
    bunker: "🛡️ กิจกรรมที่ 2: วิศวกรรมบังเกอร์สภาพอากาศ",
    coding: "🐍 กิจกรรมที่ 3: การเขียนโค้ด Micro:bit",
    bangkok: "🌊 กิจกรรมที่ 4: ความท้าทายชายฝั่งกรุงเทพฯ",
    solar: "☀️ กิจกรรมที่ 5: การออกแบบรถพลังงานแสงอาทิตย์",
    studentPortal: "🎒 พอร์ทัลนักเรียน",
    signIn: "เข้าสู่ระบบ",
    signUp: "ลงทะเบียน",
    logout: "🚪 ออกจากระบบ",
    studentProgress: "📊 ความคืบหน้าของนักเรียน",
    activitiesPosition: "🎯 ลำดับกิจกรรมและหลักสูตร",
    studentGoals: "🎯 เป้าหมายการเรียนรู้ของนักเรียน",
    searchPlaceholder: "🔍 ค้นหานักเรียน...",
    exportReport: "📥 ส่งออกรายงานความคืบหน้า CSV",
    weeklyTaskTitle: "🗓️ ระบบจัดการภารกิจรายสัปดาห์",
    assignTask: "+ มอบหมายภารกิจใหม่",
    feedbackTitle: "💬 ข้อเสนอแนะจากผู้สอน",
    sendFeedback: "✉️ ส่งข้อเสนอแนะ",
    aiTutorTitle: "🤖 ผู้ช่วยการเรียนรู้ STEM Gemini AI",
    askAi: "✨ สอบถาม AI"
  }
};

let currentLanguage = localStorage.getItem('appLanguage') || 'en';

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    applyTranslations();
  }
}

export function t(key) {
  return (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[currentLanguage][key]) {
      el.textContent = translations[currentLanguage][key];
    }
  });

  const langToggleBtn = document.getElementById('btn-lang-toggle');
  if (langToggleBtn) {
    langToggleBtn.textContent = currentLanguage === 'en' ? '🇬🇧 EN / 🇹🇭 TH' : '🇹🇭 TH / 🇬🇧 EN';
  }
}
