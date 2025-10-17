import React, { useState, useEffect } from 'react';
import './NotePreviewModal.css';
import { FaTimes, FaSave, FaEdit, FaCalendarAlt, FaClock } from 'react-icons/fa';

const NotePreviewModal = ({ isOpen, onClose, onSave, initialTitle, initialContent }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Generate a better title from the content
      const generatedTitle = generateBetterTitle(initialContent);
      setTitle(initialTitle || generatedTitle);
      setContent(initialContent || '');
      setIsEditing(true); // Start in edit mode
    }
  }, [isOpen, initialTitle, initialContent]);

  const generateBetterTitle = (content) => {
    if (!content) return 'New Note';
    
    // Extract key information from content
    const contentLower = content.toLowerCase();
    
    // Look for meeting-related keywords
    if (contentLower.includes('meeting') && contentLower.includes('client')) {
      return 'Client Meeting Notes';
    } else if (contentLower.includes('meeting')) {
      return 'Meeting Notes';
    } else if (contentLower.includes('call')) {
      return 'Call Notes';
    } else if (contentLower.includes('budget') || contentLower.includes('financial')) {
      return 'Budget Discussion';
    } else if (contentLower.includes('project')) {
      return 'Project Notes';
    } else if (contentLower.includes('task') || contentLower.includes('todo')) {
      return 'Task List';
    } else if (contentLower.includes('idea') || contentLower.includes('brainstorm')) {
      return 'Ideas & Notes';
    }
    
    // Extract first meaningful sentence or phrase
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      // Take first 4-6 words as title
      const words = firstSentence.split(' ').slice(0, 6);
      return words.join(' ') + (words.length < firstSentence.split(' ').length ? '...' : '');
    }
    
    return 'Quick Note';
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and content for your note.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content: content.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const formatContentPreview = (text) => {
    if (!text) return '';
    
    // Extract time information if present
    const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi);
    const times = timeMatch ? timeMatch.join(', ') : '';
    
    // Clean up the content
    let cleanContent = text.replace(/^\s*:\s*/, ''); // Remove leading colon
    cleanContent = cleanContent.replace(/\s+\d{1,2}:\d{2}\s*(?:AM|PM)?\s*/gi, ''); // Remove time stamps
    
    return {
      content: cleanContent,
      times: times
    };
  };

  const preview = formatContentPreview(content);

  if (!isOpen) return null;

  return (
    <div className="note-modal-overlay">
      <div className="note-modal">
        <div className="note-modal-header">
          <div className="note-modal-title">
            <FaEdit className="note-icon" />
            <span>Preview Note</span>
          </div>
          <button className="close-btn" onClick={handleCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="note-modal-content">
          {/* Title Section */}
          <div className="note-section">
            <label className="note-label">
              <FaEdit className="label-icon" />
              Title
            </label>
            <input
              type="text"
              className="note-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              maxLength={100}
            />
            <div className="char-count">{title.length}/100</div>
          </div>

          {/* Content Section */}
          <div className="note-section">
            <label className="note-label">
              <FaEdit className="label-icon" />
              Content
            </label>
            <textarea
              className="note-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note content..."
              rows={6}
              maxLength={2000}
            />
            <div className="char-count">{content.length}/2000</div>
          </div>

          {/* Preview Section */}
          <div className="note-section">
            <label className="note-label">
              <FaCalendarAlt className="label-icon" />
              Preview
            </label>
            <div className="note-preview">
              <div className="preview-title">{title || 'Untitled Note'}</div>
              <div className="preview-content">
                {preview.content || 'No content yet...'}
              </div>
              {preview.times && (
                <div className="preview-times">
                  <FaClock className="time-icon" />
                  <span>Times mentioned: {preview.times}</span>
                </div>
              )}
              <div className="preview-footer">
                <em>Added by Data AI on {new Date().toLocaleString()}</em>
              </div>
            </div>
          </div>
        </div>

        <div className="note-modal-footer">
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
          >
            {isSaving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save to Notion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotePreviewModal;
