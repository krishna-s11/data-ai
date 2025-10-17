import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaEdit, FaMagic } from 'react-icons/fa';
import './InlineNoteEditor.css';
import api from '../../utility/api';

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
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

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
    
    // Look for specific patterns that indicate important entities
    const titlePatterns = [
      // Person/entity patterns
      /(?:King|Queen|President|Prime Minister|Emperor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|was|are|were)\s+(?:the\s+)?(?:current\s+)?(?:King|Queen|President|Prime Minister|Emperor)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:also\s+known\s+as|aka)\s+/i,
      
      // Location patterns
      /(?:in|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|was)\s+(?:located\s+)?(?:in|at)/i,
      
      // General factual patterns
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|was|are|were)\s+(?:a|an|the)\s+/i,
      /(?:The\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:refers\s+to|means|represents)/i,
    ];
    
    for (const pattern of titlePatterns) {
      const match = content.match(pattern);
      if (match) {
        const titleText = match[1].trim();
        if (titleText.length > 3 && titleText.length < 50) {
          return titleText;
        }
      }
    }
    
    // Fallback: extract meaningful words for title
    const words = content.split(' ').filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'from', 'they', 'them', 'have', 'been', 'were', 'said', 'want', 'me', 'add', 'notes', 'note', 'save'].includes(word.toLowerCase())
    );
    
    if (words.length > 0) {
      return words.slice(0, 4).join(' ').replace(/[^\w\s]/g, '');
    }
    
    return 'Quick Note';
  };

  const generateAITitle = async () => {
    if (!content.trim()) return;
    
    setIsGeneratingTitle(true);
    try {
      const response = await api.post('/note_title', {
        content: content.trim()
      });
      
      if (response.data?.title) {
        setTitle(response.data.title);
      }
    } catch (error) {
      console.error('Error generating AI title:', error);
    } finally {
      setIsGeneratingTitle(false);
    }
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
          <div className="title-input-container">
            <input
              type="text"
              className="note-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              maxLength={100}
            />
            <button 
              className="ai-title-btn"
              onClick={generateAITitle}
              disabled={isGeneratingTitle || !content.trim()}
              title="Generate AI title"
            >
              <FaMagic />
              {isGeneratingTitle ? '...' : ''}
            </button>
          </div>
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
