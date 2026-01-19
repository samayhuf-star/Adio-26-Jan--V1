import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, History, Undo2, Download, Save, X, Check, Loader2, Paintbrush, Type, Layout, ArrowLeft, Phone, Mail, Clock, Image as ImageIcon, Palette, Smartphone, Edit2, MapPin, Plus } from 'lucide-react';
import { Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import { TemplateData, SavedWebsite, ChatMessage, updateSavedWebsite, downloadTemplate } from '../utils/savedWebsites';
import { generateSuggestions, SuggestionOption, SuggestionsResponse } from '../utils/templateEditorAI';

interface PresetSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
  category?: string;
}

interface SectionPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

const SECTION_PRESETS: SectionPreset[] = [
  {
    id: 'team',
    name: 'Team Section',
    description: 'Showcase your team members with bios and photos',
    prompt: 'Add a new team section with team member cards displaying photos, names, titles, and short bios'
  },
  {
    id: 'faq',
    name: 'FAQ Section',
    description: 'Answer common questions from customers',
    prompt: 'Add a new frequently asked questions (FAQ) section with expandable Q&A items'
  },
  {
    id: 'pricing',
    name: 'Pricing Section',
    description: 'Display your pricing plans and packages',
    prompt: 'Add a new pricing section with different service tiers or pricing plans with features and pricing details'
  },
  {
    id: 'gallery',
    name: 'Gallery Section',
    description: 'Display portfolio or project images',
    prompt: 'Add a new image gallery section showcasing portfolio projects or before/after examples'
  },
  {
    id: 'blog',
    name: 'Blog Section',
    description: 'Share articles and insights',
    prompt: 'Add a new blog/news section with article cards, titles, excerpts, and publication dates'
  },
  {
    id: 'partners',
    name: 'Partners Section',
    description: 'Showcase partner or client logos',
    prompt: 'Add a new partners or trusted clients section displaying partner logos and company names'
  }
];

const PRESET_SUGGESTIONS: PresetSuggestion[] = [
  // Colors & Branding
  {
    id: 'change-colors',
    label: 'Change brand colors',
    prompt: 'Change the primary brand color and update all color scheme throughout the website',
    icon: <Paintbrush className="w-3 h-3" />,
    category: 'Branding'
  },
  
  // Text Content
  {
    id: 'update-hero',
    label: 'Update hero text',
    prompt: 'Make the hero heading more compelling and action-oriented for better engagement',
    icon: <Type className="w-3 h-3" />,
    category: 'Content'
  },
  
  // Images
  {
    id: 'update-images',
    label: 'Replace placeholder images',
    prompt: 'Replace all stock photos with custom business images that showcase actual products and services',
    icon: <ImageIcon className="w-3 h-3" />,
    category: 'Media'
  },
  
  // Typography
  {
    id: 'update-fonts',
    label: 'Improve typography',
    prompt: 'Enhance font families, sizes, and text styles to match brand guidelines and improve readability',
    icon: <Type className="w-3 h-3" />,
    category: 'Design'
  },
  
  // CTAs
  {
    id: 'improve-cta',
    label: 'Improve CTAs',
    prompt: 'Make call-to-action buttons more prominent, persuasive, and action-oriented',
    icon: <Sparkles className="w-3 h-3" />,
    category: 'Conversion'
  }
];

interface SelectedElement {
  path: string;
  label: string;
  value: string;
  type: 'text' | 'image' | 'section';
}

interface QuestionField {
  id: string;
  question: string;
  placeholder: string;
  value: string;
}

interface EditableElementProps {
  path: string;
  label: string;
  value: string;
  type: 'text' | 'image' | 'section';
  selectedElement: SelectedElement | null;
  onSelect: (element: SelectedElement) => void;
  onInlineEdit?: (path: string, newValue: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'button' | 'img';
}

const EditableElement = ({
  path,
  label,
  value,
  type,
  selectedElement,
  onSelect,
  onInlineEdit,
  children,
  className = '',
  style = {},
  as: Component = 'span'
}: EditableElementProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const isSelected = selectedElement?.path === path;

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing) {
      onSelect({ path, label, value, type });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'text' && onInlineEdit) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleSave = () => {
    if (editValue.trim() !== value && onInlineEdit) {
      onInlineEdit(path, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const baseStyles: React.CSSProperties = {
    ...style,
    cursor: isEditing ? 'text' : 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
  };

  const hoverStyles: React.CSSProperties = isHovered && !isSelected && !isEditing ? {
    outline: '2px dashed rgba(99, 102, 241, 0.5)',
    outlineOffset: '2px',
    backgroundColor: type === 'image' ? undefined : 'rgba(99, 102, 241, 0.05)',
  } : {};

  const selectedStyles: React.CSSProperties = isSelected && !isEditing ? {
    outline: '2px solid rgb(99, 102, 241)',
    outlineOffset: '2px',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.2)',
  } : {};

  const editingStyles: React.CSSProperties = isEditing ? {
    outline: '2px solid rgb(34, 197, 94)',
    outlineOffset: '2px',
    boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)',
  } : {};

  const combinedStyles = { ...baseStyles, ...hoverStyles, ...selectedStyles, ...editingStyles };

  if (isEditing && type === 'text') {
    const isMultiline = value.length > 60 || value.includes('\n');
    const inputStyles: React.CSSProperties = {
      ...style,
      width: '100%',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'inherit' as const,
      resize: 'none' as const,
      padding: 0,
      margin: 0,
    };

    return (
      <Component
        data-field-path={path}
        data-field-label={label}
        className={className}
        style={combinedStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isMultiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={inputStyles}
            rows={Math.max(2, editValue.split('\n').length)}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={inputStyles}
          />
        )}
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgb(34, 197, 94)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 50,
            marginBottom: '4px',
            pointerEvents: 'none',
          }}
        >
          Editing - Enter to save, Esc to cancel
        </span>
      </Component>
    );
  }

  return (
    <Component
      data-field-path={path}
      data-field-label={label}
      className={className}
      style={combinedStyles}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && !isEditing && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgb(55, 65, 81)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 50,
            marginBottom: '4px',
            pointerEvents: 'none',
          }}
        >
          {label} - Double-click to edit
        </span>
      )}
    </Component>
  );
};

interface TemplateEditorProps {
  savedWebsite: SavedWebsite;
  onClose: () => void;
  onSave: (website: SavedWebsite) => void;
}

export const TemplateEditor = ({ savedWebsite, onClose, onSave }: TemplateEditorProps) => {
  const [templateData, setTemplateData] = useState<TemplateData>(savedWebsite.data);
  const [messages, setMessages] = useState<ChatMessage[]>(savedWebsite.messages || []);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [pendingSuggestions, setPendingSuggestions] = useState<SuggestionOption[]>([]);
  const [suggestionsGreeting, setSuggestionsGreeting] = useState<string>('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pathToLabelMap: Record<string, string> = {
    'hero.heading': 'Hero Heading',
    'hero.subheading': 'Hero Subheading',
    'hero.ctaText': 'Hero CTA Button',
    'hero_image': 'Hero Background Image',
    'features.heading': 'Features Heading',
    'services.heading': 'Services Heading',
    'services.subheading': 'Services Subheading',
    'testimonials.heading': 'Testimonials Heading',
    'cta.heading': 'CTA Heading',
    'cta.subheading': 'CTA Subheading',
    'cta.ctaText': 'CTA Button',
    'contact.phone': 'Contact Phone',
    'contact.email': 'Contact Email',
    'contact.hours': 'Contact Hours',
    'footer.companyName': 'Company Name',
    'footer.tagline': 'Company Tagline',
    'footer.address': 'Company Address',
    'footer.copyright': 'Copyright Text',
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleElementSelect = async (element: SelectedElement) => {
    setSelectedElement(element);
    
    // Capture screenshot of the selected element
    try {
      const elementWithPath = document.querySelector(`[data-field-path="${element.path}"]`);
      if (elementWithPath && elementWithPath.parentElement) {
        const canvas = await html2canvas(elementWithPath.parentElement, {
          allowTaint: true,
          useCORS: true,
          scale: 1,
          logging: false
        });
        const screenshotUrl = canvas.toDataURL('image/png');
        
        // Add screenshot message to chat
        const screenshotMessage: ChatMessage = {
          id: `msg_${Date.now()}_screenshot`,
          role: 'assistant',
          content: `I found the ${element.label} section. Here's what it looks like:`,
          screenshot: screenshotUrl,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, screenshotMessage]);
        
        // Generate context-aware suggestions based on what was selected
        try {
          const response = await generateSuggestions(
            `I just selected the ${element.label} section. What improvements would you suggest for this area?`,
            templateData,
            element.path
          );
          
          const suggestionsMessage: ChatMessage = {
            id: `msg_${Date.now()}_suggestions`,
            role: 'assistant',
            content: response.greeting,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, suggestionsMessage]);
          setPendingSuggestions(response.suggestions);
          setSuggestionsGreeting(response.greeting);
        } catch (error) {
          console.error('Error generating suggestions:', error);
        }
      }
    } catch (error) {
      console.error('Screenshot capture error:', error);
    }
    
    inputRef.current?.focus();
  };

  const applyChangesToTemplate = (changes: Record<string, any>) => {
    setTemplateData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      
      for (const [path, value] of Object.entries(changes)) {
        const keys = path.split('.');
        let obj = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          const nextKey = keys[i + 1];
          if (obj[key] === undefined) {
            obj[key] = isNaN(Number(nextKey)) ? {} : [];
          }
          obj = obj[key];
        }
        obj[keys[keys.length - 1]] = value;
      }
      
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleSendMessage = async (prompt?: string) => {
    const messageText = prompt || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setSelectedElement(null);
    setPendingSuggestions([]);
    setSuggestionsGreeting('');
    setIsLoading(true);

    try {
      const response = await generateSuggestions(messageText, templateData, selectedElement?.path);
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_suggestions`,
        role: 'assistant',
        content: response.greeting,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setSuggestionsGreeting(response.greeting);
      setPendingSuggestions(response.suggestions);

    } catch (error) {
      console.error('AI suggestion error:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again with a more specific request.',
        timestamp: new Date().toISOString()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = (suggestion: SuggestionOption) => {
    const updatedTemplateData = JSON.parse(JSON.stringify(templateData));
    
    for (const [path, value] of Object.entries(suggestion.changes)) {
      const keys = path.split('.');
      let obj = updatedTemplateData;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKey = keys[i + 1];
        if (obj[key] === undefined) {
          obj[key] = isNaN(Number(nextKey)) ? {} : [];
        }
        obj = obj[key];
      }
      obj[keys[keys.length - 1]] = value;
    }
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_applied`,
      role: 'user',
      content: `Applied: ${suggestion.title}`,
      timestamp: new Date().toISOString()
    };
    
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_confirm`,
      role: 'assistant',
      content: `Done! ${suggestion.description}`,
      timestamp: new Date().toISOString(),
      changes: JSON.stringify(suggestion.changes)
    };
    
    const newMessages = [...messages, userMessage, assistantMessage];
    
    const savedResult = updateSavedWebsite(savedWebsite.id, {
      data: updatedTemplateData,
      messages: newMessages
    });
    
    setTemplateData(updatedTemplateData);
    setMessages(newMessages);
    setPendingSuggestions([]);
    setSuggestionsGreeting('');
    
    if (savedResult) {
      setHasUnsavedChanges(false);
      onSave(savedResult);
    }
  };

  const handleSave = () => {
    const updated = updateSavedWebsite(savedWebsite.id, {
      data: templateData,
      messages: messages
    });
    if (updated) {
      setHasUnsavedChanges(false);
      onSave(updated);
    }
  };

  const handleDownload = () => {
    downloadTemplate(templateData, `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.html`);
  };


  const handleAddSection = (section: SectionPreset) => {
    setShowAddSection(false);
    handleSendMessage(section.prompt);
  };

  const clearSelection = () => {
    setSelectedElement(null);
    setInputValue('');
  };

  const handleInlineEdit = (path: string, newValue: string) => {
    applyChangesToTemplate({ [path]: newValue });
    
    const label = pathToLabelMap[path] || path;
    const displayValue = newValue.length > 40 ? newValue.substring(0, 40) + '...' : newValue;
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_inline_user`,
      role: 'user',
      content: `Changed ${label} to "${displayValue}"`,
      timestamp: new Date().toISOString()
    };
    
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_inline_assistant`,
      role: 'assistant',
      content: `Updated ${label} successfully.`,
      timestamp: new Date().toISOString(),
      changes: JSON.stringify({ [path]: newValue })
    };
    
    setMessages(prev => [...prev, userMessage, assistantMessage]);
  };

  const styles = templateData.styles || {};
  const primaryColor = styles.primaryColor || '#16a34a';
  const sectionPadding = styles.sectionPadding || '3rem';
  const cardPadding = styles.cardPadding || '1rem';

  return (
    <div className="flex h-full bg-gray-50">
      {isChatOpen && (
      <div className="w-[384px] flex flex-col border-r border-gray-200 bg-white overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-800 text-sm truncate">{savedWebsite.name}</h2>
              <p className="text-xs text-gray-500">Edit or chat</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Chat History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Close Chat Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.length === 0 && pendingSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Click any element to edit</p>
              <p className="text-sm text-gray-500 mt-1">
                Or type a change like "Change colors to blue"
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.screenshot && (
                      <img 
                        src={message.screenshot} 
                        alt="Selected element" 
                        className="w-full rounded-lg mb-2 max-h-40 object-cover border border-gray-300"
                      />
                    )}
                    <p className="text-sm">{message.content}</p>
                    
                    {message.changes && message.role === 'assistant' && (
                      <p className="text-xs mt-1 opacity-70">
                        <Check className="w-3 h-3 inline mr-1" />
                        Changes applied
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {pendingSuggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestionsGreeting && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-gray-100 text-gray-800">
                        <p className="text-sm">{suggestionsGreeting}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          If there's anything specific you want to change or improve, just describe it and we'll make it happen.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {pendingSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                {suggestion.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {suggestion.description}
                            </p>
                          </div>
                          <button
                            onClick={() => applySuggestion(suggestion)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            <Sparkles className="w-3 h-3" />
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-2 border-t border-gray-200 space-y-2">
          {selectedElement && (
            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
              <Type className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span className="text-xs text-indigo-700 flex-1 truncate">
                Editing: <strong>{selectedElement.label}</strong>
              </span>
              <button
                onClick={clearSelection}
                className="p-0.5 hover:bg-indigo-100 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={selectedElement ? "Type new value..." : "Describe your changes..."}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors ${
                hasUnsavedChanges
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Save className="w-4 h-4" />
              {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
      )}

      <div className={`${isChatOpen ? 'flex-1' : 'w-full'} overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-3 relative`}>
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="absolute top-4 left-4 z-10 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            title="Open Chat Panel"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-5xl mx-auto">
          <div 
            className="relative h-64 md:h-[320px] bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${templateData.hero_image})`, backgroundSize: 'cover' }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 text-center text-white px-4 py-8">
              <EditableElement
                path="hero.heading"
                label="Hero Heading"
                value={templateData.hero.heading}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="h1"
                className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight"
              >
                {templateData.hero.heading}
              </EditableElement>
              <EditableElement
                path="hero.subheading"
                label="Hero Subheading"
                value={templateData.hero.subheading}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="p"
                className="text-base md:text-lg mb-6 opacity-90 max-w-2xl mx-auto"
              >
                {templateData.hero.subheading}
              </EditableElement>
              <EditableElement
                path="hero.ctaText"
                label="Hero CTA Button"
                value={templateData.hero.ctaText}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="button"
                className="px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold transition-colors text-white hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {templateData.hero.ctaText}
              </EditableElement>
            </div>
          </div>

          <div className="px-4 md:px-8 bg-white" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div className="max-w-5xl mx-auto">
              <EditableElement
                path="features.heading"
                label="Features Heading"
                value={templateData.features.heading}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="h2"
                className="text-2xl font-bold text-center text-gray-800 mb-8"
              >
                {templateData.features.heading}
              </EditableElement>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {templateData.features.items.map((feature, index) => (
                  <div key={index} className="text-center rounded-xl" style={{ backgroundColor: `${primaryColor}10`, padding: cardPadding }}>
                    <div className="text-3xl mb-2">{feature.icon}</div>
                    <EditableElement
                      path={`features.items.${index}.title`}
                      label={`Feature ${index + 1} Title`}
                      value={feature.title}
                      type="text"
                      selectedElement={selectedElement}
                      onSelect={handleElementSelect}
                      onInlineEdit={handleInlineEdit}
                      as="h3"
                      className="text-sm font-semibold text-gray-800 mb-1"
                    >
                      {feature.title}
                    </EditableElement>
                    <EditableElement
                      path={`features.items.${index}.desc`}
                      label={`Feature ${index + 1} Description`}
                      value={feature.desc}
                      type="text"
                      selectedElement={selectedElement}
                      onSelect={handleElementSelect}
                      onInlineEdit={handleInlineEdit}
                      as="p"
                      className="text-gray-600 text-xs"
                    >
                      {feature.desc}
                    </EditableElement>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 bg-gray-50" style={{ paddingTop: sectionPadding, paddingBottom: sectionPadding }}>
            <div className="max-w-4xl mx-auto">
              <EditableElement
                path="services.heading"
                label="Services Heading"
                value={templateData.services.heading}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="h2"
                className="text-2xl font-bold text-center text-gray-800 mb-2"
              >
                {templateData.services.heading}
              </EditableElement>
              <EditableElement
                path="services.subheading"
                label="Services Subheading"
                value={templateData.services.subheading}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="p"
                className="text-center text-gray-600 mb-8 text-sm"
              >
                {templateData.services.subheading}
              </EditableElement>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templateData.services.items.map((service, index) => (
                  <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md">
                    <EditableElement
                      path={`services.items.${index}.image`}
                      label={`Service ${index + 1} Image`}
                      value={service.image}
                      type="image"
                      selectedElement={selectedElement}
                      onSelect={handleElementSelect}
                      onInlineEdit={handleInlineEdit}
                      as="div"
                      className="w-full h-32 bg-cover bg-center"
                      style={{ backgroundImage: `url(${service.image})` }}
                    >
                      <div className="w-full h-full" />
                    </EditableElement>
                    <div style={{ padding: cardPadding }}>
                      <EditableElement
                        path={`services.items.${index}.title`}
                        label={`Service ${index + 1} Title`}
                        value={service.title}
                        type="text"
                        selectedElement={selectedElement}
                        onSelect={handleElementSelect}
                        onInlineEdit={handleInlineEdit}
                        as="h3"
                        className="text-base font-semibold text-gray-800 mb-1"
                      >
                        {service.title}
                      </EditableElement>
                      <EditableElement
                        path={`services.items.${index}.desc`}
                        label={`Service ${index + 1} Description`}
                        value={service.desc}
                        type="text"
                        selectedElement={selectedElement}
                        onSelect={handleElementSelect}
                        onInlineEdit={handleInlineEdit}
                        as="p"
                        className="text-gray-600 text-xs mb-2"
                      >
                        {service.desc}
                      </EditableElement>
                      <EditableElement
                        path={`services.items.${index}.price`}
                        label={`Service ${index + 1} Price`}
                        value={service.price}
                        type="text"
                        selectedElement={selectedElement}
                        onSelect={handleElementSelect}
                        onInlineEdit={handleInlineEdit}
                        as="p"
                        className="font-bold text-sm"
                        style={{ color: primaryColor }}
                      >
                        {service.price}
                      </EditableElement>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 bg-white" style={{ paddingTop: sectionPadding, paddingBottom: sectionPadding }}>
            <div className="max-w-4xl mx-auto">
              <EditableElement
                path="testimonials.heading"
                label="Testimonials Heading"
                value={templateData.testimonials.heading}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="h2"
                className="text-2xl font-bold text-center text-gray-800 mb-8"
              >
                {templateData.testimonials.heading}
              </EditableElement>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templateData.testimonials.items.map((testimonial, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl" style={{ padding: cardPadding }}>
                    <div className="flex items-center gap-3 mb-3">
                      <EditableElement
                        path={`testimonials.items.${index}.avatar`}
                        label={`Testimonial ${index + 1} Avatar`}
                        value={testimonial.avatar}
                        type="image"
                        selectedElement={selectedElement}
                        onSelect={handleElementSelect}
                        onInlineEdit={handleInlineEdit}
                        as="div"
                        className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${testimonial.avatar})` }}
                      >
                        <div className="w-full h-full" />
                      </EditableElement>
                      <div>
                        <EditableElement
                          path={`testimonials.items.${index}.name`}
                          label={`Testimonial ${index + 1} Name`}
                          value={testimonial.name}
                          type="text"
                          selectedElement={selectedElement}
                          onSelect={handleElementSelect}
                          onInlineEdit={handleInlineEdit}
                          as="h4"
                          className="font-semibold text-gray-800 text-sm"
                        >
                          {testimonial.name}
                        </EditableElement>
                        <EditableElement
                          path={`testimonials.items.${index}.company`}
                          label={`Testimonial ${index + 1} Company`}
                          value={testimonial.company}
                          type="text"
                          selectedElement={selectedElement}
                          onSelect={handleElementSelect}
                          onInlineEdit={handleInlineEdit}
                          as="p"
                          className="text-xs text-gray-500"
                        >
                          {testimonial.company}
                        </EditableElement>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <EditableElement
                      path={`testimonials.items.${index}.text`}
                      label={`Testimonial ${index + 1} Text`}
                      value={testimonial.text}
                      type="text"
                      selectedElement={selectedElement}
                      onSelect={handleElementSelect}
                      onInlineEdit={handleInlineEdit}
                      as="p"
                      className="text-gray-600 text-xs italic"
                    >
                      "{testimonial.text}"
                    </EditableElement>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div 
            className="px-4 text-center text-white"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${styles.secondaryColor || '#15803d'})`, paddingTop: sectionPadding, paddingBottom: sectionPadding }}
          >
            <EditableElement
              path="cta.heading"
              label="CTA Heading"
              value={templateData.cta.heading}
              type="text"
              selectedElement={selectedElement}
              onSelect={handleElementSelect}
              onInlineEdit={handleInlineEdit}
              as="h2"
              className="text-2xl font-bold mb-2"
            >
              {templateData.cta.heading}
            </EditableElement>
            <EditableElement
              path="cta.subheading"
              label="CTA Subheading"
              value={templateData.cta.subheading}
              type="text"
              selectedElement={selectedElement}
              onSelect={handleElementSelect}
              onInlineEdit={handleInlineEdit}
              as="p"
              className="text-base mb-6 opacity-90"
            >
              {templateData.cta.subheading}
            </EditableElement>
            <EditableElement
              path="cta.ctaText"
              label="CTA Button"
              value={templateData.cta.ctaText}
              type="text"
              selectedElement={selectedElement}
              onSelect={handleElementSelect}
              onInlineEdit={handleInlineEdit}
              as="button"
              className="bg-white px-6 py-2.5 rounded-lg font-semibold transition-colors hover:bg-gray-100"
              style={{ color: primaryColor }}
            >
              {templateData.cta.ctaText}
            </EditableElement>
          </div>

          <div className="py-8 px-4 bg-gray-800 text-white">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                  <EditableElement
                    path="contact.phone"
                    label="Contact Phone"
                    value={templateData.contact.phone}
                    type="text"
                    selectedElement={selectedElement}
                    onSelect={handleElementSelect}
                    onInlineEdit={handleInlineEdit}
                    as="span"
                    className="text-gray-300"
                  >
                    {templateData.contact.phone}
                  </EditableElement>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                  <EditableElement
                    path="contact.email"
                    label="Contact Email"
                    value={templateData.contact.email}
                    type="text"
                    selectedElement={selectedElement}
                    onSelect={handleElementSelect}
                    onInlineEdit={handleInlineEdit}
                    as="span"
                    className="text-gray-300"
                  >
                    {templateData.contact.email}
                  </EditableElement>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                  <EditableElement
                    path="contact.hours"
                    label="Contact Hours"
                    value={templateData.contact.hours}
                    type="text"
                    selectedElement={selectedElement}
                    onSelect={handleElementSelect}
                    onInlineEdit={handleInlineEdit}
                    as="span"
                    className="text-gray-300"
                  >
                    {templateData.contact.hours}
                  </EditableElement>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-6 flex items-center justify-between">
                <div>
                  <EditableElement
                    path="footer.companyName"
                    label="Company Name"
                    value={templateData.footer.companyName}
                    type="text"
                    selectedElement={selectedElement}
                    onSelect={handleElementSelect}
                    onInlineEdit={handleInlineEdit}
                    as="h3"
                    className="font-bold"
                  >
                    {templateData.footer.companyName}
                  </EditableElement>
                  <EditableElement
                    path="footer.tagline"
                    label="Company Tagline"
                    value={templateData.footer.tagline}
                    type="text"
                    selectedElement={selectedElement}
                    onSelect={handleElementSelect}
                    onInlineEdit={handleInlineEdit}
                    as="p"
                    className="text-gray-400 text-xs"
                  >
                    {templateData.footer.tagline}
                  </EditableElement>
                </div>
                <div className="flex gap-4">
                  {templateData.footer.links.map((link, index) => (
                    <a key={index} href={link.href} className="text-gray-400 hover:text-white text-xs transition-colors">
                      {link.text}
                    </a>
                  ))}
                </div>
              </div>
              <EditableElement
                path="footer.copyright"
                label="Copyright Text"
                value={templateData.footer.copyright}
                type="text"
                selectedElement={selectedElement}
                onSelect={handleElementSelect}
                onInlineEdit={handleInlineEdit}
                as="p"
                className="text-center text-gray-500 text-xs mt-6"
              >
                {templateData.footer.copyright}
              </EditableElement>
            </div>
          </div>
        </div>
      </div>

      {showAddSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Section</h3>
              <button
                onClick={() => setShowAddSection(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Choose a section type to add to your website</p>
            
            <div className="space-y-2">
              {SECTION_PRESETS.map(section => (
                <button
                  key={section.id}
                  onClick={() => handleAddSection(section)}
                  disabled={isLoading}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-gray-900">{section.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{section.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
