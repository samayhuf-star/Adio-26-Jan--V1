import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, FileText, ImageIcon, Film, Loader } from 'lucide-react';
import { notifications } from '../utils/notifications';
import { getSessionTokenSync } from '../utils/auth';

interface DocumentationItem {
  id: string;
  title: string;
  category: string;
  content: string;
  images: string[];
  videos: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

interface DocumentationManagerProps {}

const DEFAULT_CATEGORIES = [
  'Getting Started',
  'Campaign Builder',
  'Keywords & Tools',
  'Billing & Plans',
  'Troubleshooting',
  'API Docs',
  'FAQ'
];

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getSessionTokenSync();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, { ...options, headers });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export const DocumentationManager: React.FC<DocumentationManagerProps> = () => {
  const [docs, setDocs] = useState<DocumentationItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentationItem>>({
    title: '',
    category: 'Getting Started',
    content: '',
    images: [],
    videos: [],
    status: 'draft'
  });

  useEffect(() => {
    loadDocumentation();
  }, []);

  const loadDocumentation = async () => {
    setLoading(true);
    try {
      try {
        const data = await apiRequest('/api/support-tickets');
        
        const formattedDocs: DocumentationItem[] = (data?.support_tickets || []).map((ticket: any) => ({
          id: ticket.id,
          title: ticket.subject || 'Untitled',
          category: ticket.category || 'Getting Started',
          content: ticket.message || '',
          images: ticket.images || [],
          videos: ticket.videos || [],
          status: ticket.status === 'published' ? 'published' : 'draft',
          created_at: ticket.created_at || new Date().toISOString(),
          updated_at: ticket.updated_at || new Date().toISOString(),
        }));
        
        setDocs(formattedDocs);
        console.log(`📚 Loaded ${formattedDocs.length} documentation items`);
      } catch (apiError) {
        console.error('Error loading from API:', apiError);
        const stored = localStorage.getItem('admin_docs');
        if (stored) {
          try {
            setDocs(JSON.parse(stored));
          } catch {
            setDocs([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading documentation:', error);
      const stored = localStorage.getItem('admin_docs');
      if (stored) {
        try {
          setDocs(JSON.parse(stored));
        } catch {
          setDocs([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDocs = async (newDoc?: Partial<DocumentationItem>, docId?: string) => {
    if (!newDoc) return;

    setUploading(true);
    try {
      let updatedDocs = [...docs];
      
      if (docId) {
        updatedDocs = updatedDocs.map(d => d.id === docId ? {
          ...d,
          ...newDoc,
          updated_at: new Date().toISOString()
        } as DocumentationItem : d);
        notifications.success('Documentation updated');
        
        try {
          await apiRequest(`/api/support-tickets/${docId}`, {
            method: 'PUT',
            body: JSON.stringify({
              subject: newDoc.title,
              message: newDoc.content,
              status: newDoc.status === 'published' ? 'published' : 'draft',
              category: newDoc.category,
              updated_at: new Date().toISOString()
            }),
          });
        } catch (apiError) {
          console.error('Error updating via API:', apiError);
        }
      } else {
        const newDocItem: DocumentationItem = {
          id: `doc-${Date.now()}`,
          title: newDoc.title!,
          category: newDoc.category || 'Getting Started',
          content: newDoc.content!,
          images: newDoc.images || [],
          videos: newDoc.videos || [],
          status: newDoc.status || 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        updatedDocs = [newDocItem, ...updatedDocs];
        notifications.success('Documentation created');
        
        try {
          await apiRequest('/api/support-tickets', {
            method: 'POST',
            body: JSON.stringify({
              subject: newDoc.title,
              message: newDoc.content,
              status: newDoc.status === 'published' ? 'published' : 'draft',
              category: newDoc.category,
              priority: 'medium'
            }),
          });
        } catch (apiError) {
          console.error('Error creating via API:', apiError);
        }
      }
      
      localStorage.setItem('admin_docs', JSON.stringify(updatedDocs));
      setDocs(updatedDocs);
    } catch (error) {
      console.error('Error saving documentation:', error);
      notifications.error('Failed to save documentation');
    } finally {
      setUploading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Getting Started',
      content: '',
      images: [],
      videos: [],
      status: 'draft'
    });
  };

  const handleEditDoc = (doc: DocumentationItem) => {
    setEditingId(doc.id);
    setFormData(doc);
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Are you sure you want to delete this documentation?')) {
      try {
        await apiRequest(`/api/support-tickets/${id}`, {
          method: 'DELETE',
        });
        notifications.success('Documentation deleted');
        await loadDocumentation();
      } catch (error) {
        console.error('Error deleting documentation:', error);
        notifications.error('Failed to delete documentation');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      notifications.error('Title and content are required');
      return;
    }

    await saveDocs(formData, editingId || undefined);
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Getting Started',
      content: '',
      images: [],
      videos: [],
      status: 'draft'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = event.target?.result as string;
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), imageData]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoEmbed = (url: string) => {
    if (url.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...(prev.videos || []), url]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos?.filter((_, i) => i !== index) || []
    }));
  };

  const filteredDocs = docs.filter(doc => {
    const matchCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (editingId !== null || (editingId === null && !docs.length)) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit' : 'Create'} Documentation</h3>
            <p className="text-gray-500 mt-1">Add or update help documentation with rich content</p>
          </div>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({});
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 space-y-4 border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Documentation title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={formData.category || 'Getting Started'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {DEFAULT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your documentation content here. Supports markdown formatting."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <div className="flex gap-2 mb-3">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100"
              >
                <ImageIcon className="w-4 h-4" />
                Upload Images
              </label>
            </div>
            {formData.images && formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="preview" className="w-full h-24 object-cover rounded" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                id="video-url"
                placeholder="YouTube or Vimeo URL"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  const url = (document.getElementById('video-url') as HTMLInputElement)?.value;
                  if (url) {
                    handleVideoEmbed(url);
                    (document.getElementById('video-url') as HTMLInputElement).value = '';
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
              >
                <Film className="w-4 h-4" />
                Add Video
              </button>
            </div>
            {formData.videos && formData.videos.length > 0 && (
              <div className="space-y-2">
                {formData.videos.map((video, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-100 p-3 rounded">
                    <span className="text-sm text-gray-600 truncate">{video}</span>
                    <button
                      onClick={() => removeVideo(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status || 'draft'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="draft">Draft (Hidden)</option>
              <option value="published">Published (Visible)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : 'Create'} & Publish
            </button>
            {editingId && (
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Documentation Manager</h3>
          <p className="text-gray-500 mt-1">Create and manage help documentation for users</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search documentation..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Categories</option>
          {DEFAULT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documentation found</p>
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      doc.status === 'published' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{doc.category}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.content}</p>
                  {doc.images.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">📷 {doc.images.length} image(s)</p>
                  )}
                  {doc.videos.length > 0 && (
                    <p className="text-xs text-gray-400">🎥 {doc.videos.length} video(s)</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditDoc(doc)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
