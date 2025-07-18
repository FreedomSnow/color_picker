import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ContactUs.module.css';

const ContactUs = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 按照指定格式组合content
    const content = `${formData.name}\n\n${formData.subject}\n\n${formData.message}`;
    
    // 创建FormData对象
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('title', '["colorpicker"]');
    formDataToSubmit.append('contact', formData.email);
    formDataToSubmit.append('content', content);
    
    try {
      const response = await fetch('http://43.138.115.192:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formDataToSubmit
      });
      
      if (response.ok) {
        alert(t('contactUs.submitSuccess'));
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        onClose();
      } else {
        alert(t('contactUs.submitError') || '提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('提交错误:', error);
      alert(t('contactUs.submitError') || '提交失败，请稍后重试');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{t('contactUs.title')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">{t('contactUs.name')}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('contactUs.namePlaceholder')}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">{t('contactUs.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('contactUs.emailPlaceholder')}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="subject">{t('contactUs.subject')}</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={t('contactUs.subjectPlaceholder')}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message">{t('contactUs.message')}</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder={t('contactUs.messagePlaceholder')}
              rows="5"
              required
            />
          </div>

          <div className={styles.contactInfo}>
            <h3>{t('contactUs.contactInfo')}</h3>
            <p>{t('contactUs.emailInfo')}</p>
            <p>{t('contactUs.responseTime')}</p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
              {t('contactUs.cancel')}
            </button>
            <button type="submit" className={styles.submitBtn}>
              {t('contactUs.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactUs; 