import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaEdit } from 'react-icons/fa';
import './InlineNoteEditor.css';

const InlineNoteEditor = ({ 
  initialTitle, 
  initialContent, 
  onSave, 
  onCancel, 
  isVisible = true 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Generate a better title from the content
      const generatedTitle = generateBetterTitle(initialContent);
      setTitle(initialTitle || generatedTitle);
      setContent(initialContent || '');
    }
  }, [isVisible, initialTitle, initialContent]);

  const generateBetterTitle = (content) => {
    if (!content) return 'Quick Note';
    
    // Extract meaningful words for title
    const words = content.split(' ').filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'from', 'they', 'them', 'have', 'been', 'were', 'said'].includes(word.toLowerCase())
    );
    
    if (words.length > 0) {
      return words.slice(0, 4).join(' ').replace(/[^\w\s]/g, '');
    }
    
    return 'Quick Note';
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({ title: title.trim(), content: content.trim() });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  if (!isVisible) return null;

  return (
    <div className="inline-note-editor">
      <div className="note-editor-header">
        <div className="note-editor-title">
          <FaEdit className="note-icon" />
          <span>Edit Note</span>
        </div>
        <div className="note-editor-actions">
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
          >
            <FaSave />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="note-editor-content">
        {/* Title Input */}
        <div className="note-field">
          <label className="note-label">Title</label>
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

        {/* Content Input */}
        <div className="note-field">
          <label className="note-label">Content</label>
          <textarea
            className="note-content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your note content..."
            rows={4}
            maxLength={2000}
          />
          <div className="char-count">{content.length}/2000</div>
        </div>
      </div>
    </div>
  );
};

export default InlineNoteEditor;
