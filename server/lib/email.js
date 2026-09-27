/**
 * Outbound email interface.
 * Phase 0: Default transport is disabled (isEmailConfigured() = false), returning EMAIL_NOT_CONFIGURED.
 * Dev transport: EMAIL_TRANSPORT=console logs rendered message to server console.
 */

export function isEmailConfigured() {
  return process.env.EMAIL_TRANSPORT === 'console';
}

export async function sendEmail({ to, template, locale = 'en', data = {} }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'EMAIL_NOT_CONFIGURED' };
  }

  const subjectMap = {
    activation: { en: 'Activate your WeLearn account', zh: '激活您的 WeLearn 帐户', th: 'เปิดใช้งานบัญชี WeLearn ของคุณ' },
    'change-email': { en: 'Confirm your email change', zh: '确认您的电子邮件变更', th: 'ยืนยันการเปลี่ยนอีเมลของคุณ' },
    'parent-weekly': { en: 'WeLearn Weekly Summary', zh: 'WeLearn 每周摘要', th: 'สรุปประจำสัปดาห์ WeLearn' }
  };

  const subject = subjectMap[template]?.[locale] || subjectMap[template]?.en || 'WeLearn Notification';

  console.log('\n=================== Outbound Email (Dev Transport) ===================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Template: ${template} (${locale})`);
  console.log(`Data: ${JSON.stringify(data, null, 2)}`);
  console.log('======================================================================\n');

  return { sent: true };
}
