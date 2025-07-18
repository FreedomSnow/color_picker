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

  const handleSubmit = (e) => {
    e.preventDefault();
    // 这里可以添加提交逻辑，比如发送到服务器
    console.log('提交的联系信息:', formData);
    alert(t('contactUs.submitSuccess'));
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    onClose();
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