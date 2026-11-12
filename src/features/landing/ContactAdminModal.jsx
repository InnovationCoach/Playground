import { useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, CheckCircle2, MessageSquare, Send, Sparkles } from 'lucide-react';

export function ContactAdminModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'parent',
    interest: 'spark-platform',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle | sending | sent

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    // Store in localStorage for contact persistence / dev review
    try {
      const inquiries = JSON.parse(localStorage.getItem('welearn:inquiries') || '[]');
      inquiries.push({
        ...formData,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem('welearn:inquiries', JSON.stringify(inquiries));
    } catch {}

    setTimeout(() => {
      setStatus('sent');
    }, 600);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'parent',
      interest: 'spark-platform',
      message: ''
    });
    setStatus('idle');
  };

  return (
    <div className="spark-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <div className="spark-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="spark-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="spark-modal-header">
          <span className="spark-modal-badge">
            <Sparkles size={14} /> Admissions & Administration
          </span>
          <h2 id="contact-modal-title">Connect with WeLearn SPARK Admin</h2>
          <p className="spark-modal-subtitle">
            Whether you are exploring enrollment, our Mastery Transcript (MTC) pathway, AI integration, or partnership opportunities — our team is here to assist.
          </p>
        </div>

        <div className="spark-modal-body">
          {/* Quick info bar */}
          <div className="spark-contact-quickbar">
            <a href="mailto:admissions@welearnthailand.com" className="spark-quick-item">
              <Mail size={16} className="spark-quick-icon" />
              <div>
                <strong>Email Us</strong>
                <span>admissions@welearnthailand.com</span>
              </div>
            </a>

            <a href="https://wa.me/66818329999" target="_blank" rel="noopener noreferrer" className="spark-quick-item">
              <Phone size={16} className="spark-quick-icon" />
              <div>
                <strong>WhatsApp / Call</strong>
                <span>+66 81 832 9999</span>
              </div>
            </a>

            <div className="spark-quick-item">
              <MapPin size={16} className="spark-quick-icon" />
              <div>
                <strong>Campus</strong>
                <span>Bangkok, Thailand</span>
              </div>
            </div>
          </div>

          {status === 'sent' ? (
            <div className="spark-modal-success">
              <div className="spark-success-icon">
                <CheckCircle2 size={48} />
              </div>
              <h3>Message Sent to Admin!</h3>
              <p>
                Thank you for reaching out, <strong>{formData.name || 'there'}</strong>. Our administration and admissions team has received your inquiry and will respond within 24 hours.
              </p>
              <div className="spark-modal-success-actions">
                <a
                  href="https://welearnthailand.com/discovery-call"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spark-btn-primary"
                >
                  <Calendar size={16} /> Book a Free Discovery Call Now
                </a>
                <button type="button" onClick={handleReset} className="spark-btn-secondary">
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="spark-modal-form">
              <div className="spark-form-grid">
                <div className="spark-form-field">
                  <label htmlFor="contact-name">Your Name *</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="spark-form-field">
                  <label htmlFor="contact-email">Email Address *</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="e.g. sarah@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="spark-form-field">
                  <label htmlFor="contact-phone">Phone / WhatsApp</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +66 81 234 5678"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="spark-form-field">
                  <label htmlFor="contact-role">I am a *</label>
                  <select id="contact-role" name="role" value={formData.role} onChange={handleChange}>
                    <option value="parent">Prospective Parent</option>
                    <option value="student">Prospective Student (Ages 11–18)</option>
                    <option value="educator">Educator / School Leader</option>
                    <option value="partner">Academic Partner / Organization</option>
                  </select>
                </div>
              </div>

              <div className="spark-form-field">
                <label htmlFor="contact-interest">Primary Area of Interest</label>
                <select id="contact-interest" name="interest" value={formData.interest} onChange={handleChange}>
                  <option value="spark-platform">WeLearn SPARK Platform & Learning System</option>
                  <option value="mtc-mastery">Mastery Transcript Consortium (MTC) / Mastery.org</option>
                  <option value="admissions">Admissions & Enrollment (Gifted & 2e Learners)</option>
                  <option value="ai-scaffolding">AI Companion & Socratic Learning Inquiries</option>
                  <option value="discovery-call">Scheduling a Discovery Call & Campus Visit</option>
                </select>
              </div>

              <div className="spark-form-field">
                <label htmlFor="contact-message">How can we help? *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  placeholder="Tell us about the learner's interests, grade level, or questions about SPARK..."
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <div className="spark-modal-actions">
                <button type="submit" disabled={status === 'sending'} className="spark-btn-primary spark-btn-full">
                  {status === 'sending' ? (
                    'Sending to Admin...'
                  ) : (
                    <>
                      <Send size={16} /> Send Inquiry to Admin
                    </>
                  )}
                </button>
              </div>

              <div className="spark-form-footer-note">
                Prefer to schedule directly?{' '}
                <a
                  href="https://welearnthailand.com/discovery-call"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spark-link"
                >
                  Book a 30-min discovery call <Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
