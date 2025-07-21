import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaTwitter, FaFacebook, FaLinkedin, FaLink, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/ShareModal.css';

const ShareModal = ({ isOpen, onClose, url, title }) => {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        return;
    }

    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(shareUrl, 'Share', `width=${width},height=${height},top=${top},left=${left}`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal" ref={modalRef}>
          <div className="modal-header">
            <h3>Share this post</h3>
            <button onClick={onClose} className="close-button" aria-label="Close">
              <FaTimes />
            </button>
          </div>

          <div className="modal-body">
            <div className="social-buttons">
              <button className="twitter" onClick={() => shareOnSocial('twitter')} aria-label="Twitter">
                <FaTwitter />
              </button>
              <button className="facebook" onClick={() => shareOnSocial('facebook')} aria-label="Facebook">
                <FaFacebook />
              </button>
              <button className="linkedin" onClick={() => shareOnSocial('linkedin')} aria-label="LinkedIn">
                <FaLinkedin />
              </button>
            </div>

            <div className="copy-section">
              <label htmlFor="share-link">Or copy link</label>
              <div className="copy-container">
                <input type="text" id="share-link" readOnly value={url} />
                <button
                  onClick={handleCopyLink}
                  className={copied ? 'copied' : ''}
                >
                  {copied ? <><FaCheck /> Copied!</> : <><FaLink /> Copy</>}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button onClick={onClose} className="done-button">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
