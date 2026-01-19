import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Bug, 
  Lightbulb, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Reply,
  Filter,
  Search,
  Calendar,
  User,
  ExternalLink,
  Trash2,
  BarChart3,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getAllFeedback, updateFeedbackStatus, type FeedbackRecord } from '../utils/feedbackService';
import { useNotification } from '../contexts/NotificationContext';

export const FeedbackManagement: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
  });
  const { success, error } = useNotification();

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedback, filters]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await getAllFeedback();
      setFeedback(data);
    } catch (err) {
      error('Failed to load feedback', 'Please try again later');
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedback];

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.message.toLowerCase().includes(searchLower) ||
        item.user_email?.toLowerCase().includes(searchLower) ||
        item.page_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredFeedback(filtered);
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: FeedbackRecord['status']) => {
    try {
      await updateFeedbackStatus(feedbackId, newStatus);
      setFeedback(prev => 
        prev.map(item => 
          item.id === feedbackId 
            ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
            : item
        )
      );
      success('Status updated successfully');
    } catch (err) {
      error('Failed to update status', 'Please try again');
      console.error('Error updating status:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="w-4 h-4 text-red-500" />;
      case 'feature_request':
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.new}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug_report':
        return 'Bug Report';
      case 'feature_request':
        return 'Feature Request';
      default:
        return 'Feedback';
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  const getAnalytics = () => {
    const total = feedback.length;
    const byType = {
      feedback: feedback.filter(f => f.type === 'feedback').length,
      bug_report: feedback.filter(f => f.type === 'bug_report').length,
      feature_request: feedback.filter(f => f.type === 'feature_request').length,
    };
    const byStatus = {
      new: feedback.filter(f => f.status === 'new').length,
      reviewed: feedback.filter(f => f.status === 'reviewed').length,
      in_progress: feedback.filter(f => f.status === 'in_progress').length,
      resolved: feedback.filter(f => f.status === 'resolved').length,
    };
    const avgRating = feedback
      .filter(f => f.rating)
      .reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length || 0;

    return { total, byType, byStatus, avgRating };
  };

  const analytics = getAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600">Manage user feedback, feature requests, and bug reports</p>
        </div>
        <Button onClick={loadFeedback} variant="outline">
          <BarChart3 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">All Feedback ({analytics.total})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Feedback</p>
                    <p className="text-2xl font-bold">{analytics.total}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bug Reports</p>
                    <p className="text-2xl font-bold text-red-600">{analytics.byType.bug_report}</p>
                  </div>
                  <Bug className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Feature Requests</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.byType.feature_request}</p>
                  </div>
                  <Lightbulb className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {analytics.avgRating ? analytics.avgRating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getTypeLabel(item.type)}</span>
                        {getStatusBadge(item.status)}
                        {item.rating && renderStars(item.rating)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{item.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.user_email || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(item);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="Search feedback..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <Select
                  value={filters.type}
                  onValueChange={(value: string) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="bug_report">Bug Reports</SelectItem>
                    <SelectItem value="feature_request">Feature Requests</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getTypeIcon(item.type)}
                        <span className="font-semibold">{getTypeLabel(item.type)}</span>
                        {getStatusBadge(item.status)}
                        {item.rating && renderStars(item.rating)}
                      </div>
                      
                      <p className="text-gray-800 mb-4">{item.message}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {item.user_email || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {item.page_name && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-4 h-4" />
                            {item.page_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={item.status}
                        onValueChange={(value: FeedbackRecord['status']) => 
                          handleStatusUpdate(item.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFeedback(item);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFeedback(item);
                          setShowResponse(true);
                        }}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFeedback.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
                <p className="text-gray-500">No feedback matches your current filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${(count / analytics.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        <span>{getTypeLabel(type)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${(count / analytics.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedFeedback.type)}
                {getTypeLabel(selectedFeedback.type)} Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedFeedback.status)}
                {selectedFeedback.rating && renderStars(selectedFeedback.rating)}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Message</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedFeedback.message}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">User:</span>
                  <p>{selectedFeedback.user_email || 'Anonymous'}</p>
                </div>
                <div>
                  <span className="font-medium">Date:</span>
                  <p>{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium">Page:</span>
                  <p>{selectedFeedback.page_name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium">Screen Size:</span>
                  <p>{selectedFeedback.screen_size || 'Unknown'}</p>
                </div>
              </div>
              
              {selectedFeedback.page_url && (
                <div>
                  <span className="font-medium">URL:</span>
                  <a 
                    href={selectedFeedback.page_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-2"
                  >
                    {selectedFeedback.page_url}
                  </a>
                </div>
              )}
              
              {selectedFeedback.browser_info && (
                <div>
                  <span className="font-medium">Browser:</span>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedFeedback.browser_info}
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowDetails(false);
                  setShowResponse(true);
                }}
              >
                <Reply className="w-4 h-4 mr-2" />
                Respond
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Response Modal */}
      {selectedFeedback && (
        <Dialog open={showResponse} onOpenChange={setShowResponse}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Respond to Feedback</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Original message:</p>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  {selectedFeedback.message.substring(0, 100)}...
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Your Response</label>
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Thank you for your feedback..."
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResponse(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement response sending
                  success('Response sent successfully');
                  setShowResponse(false);
                  setResponseText('');
                }}
                disabled={!responseText.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};