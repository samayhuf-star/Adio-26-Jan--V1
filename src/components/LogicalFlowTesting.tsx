import React, { useState, useEffect } from 'react';
import {
  TestTube, Code, Play, CheckCircle2, XCircle, AlertCircle,
  FileText, Save, Trash2, Plus, Edit2, Eye, EyeOff,
  ChevronRight, ChevronDown, Zap, BookOpen, Settings, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { notifications } from '../utils/notifications';

interface TestRule {
  id: string;
  title: string;
  description: string;
  category: 'logic' | 'functionality' | 'ui' | 'data' | 'integration';
  rules: string[];
  testCases: TestCase[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  actualOutput?: any;
  status: 'pending' | 'passed' | 'failed' | 'running';
  error?: string;
}

export const LogicalFlowTesting: React.FC = () => {
  const [rules, setRules] = useState<TestRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<TestRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for creating/editing rules
  const [ruleForm, setRuleForm] = useState<Partial<TestRule>>({
    title: '',
    description: '',
    category: 'logic',
    rules: [''],
    testCases: [],
    status: 'draft'
  });

  // Load rules from localStorage on mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    try {
      const stored = localStorage.getItem('logical_flow_testing_rules');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRules(parsed);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  const saveRules = (updatedRules: TestRule[]) => {
    try {
      localStorage.setItem('logical_flow_testing_rules', JSON.stringify(updatedRules));
      setRules(updatedRules);
      notifications.success('Rules saved successfully!', {
        title: 'Saved'
      });
    } catch (error) {
      console.error('Error saving rules:', error);
      notifications.error('Failed to save rules', {
        title: 'Error'
      });
    }
  };

  const handleCreateRule = () => {
    setIsCreating(true);
    setSelectedRule(null);
    setRuleForm({
      title: '',
      description: '',
      category: 'logic',
      rules: [''],
      testCases: [],
      status: 'draft'
    });
  };

  const handleEditRule = (rule: TestRule) => {
    setSelectedRule(rule);
    setIsEditing(true);
    setIsCreating(false);
    setRuleForm({
      ...rule,
      rules: rule.rules.length > 0 ? rule.rules : ['']
    });
  };

  const handleSaveRule = () => {
    if (!ruleForm.title?.trim()) {
      notifications.warning('Please enter a title for the rule', {
        title: 'Validation Error'
      });
      return;
    }

    const now = new Date().toISOString();
    const newRule: TestRule = {
      id: selectedRule?.id || `rule-${Date.now()}`,
      title: ruleForm.title,
      description: ruleForm.description || '',
      category: ruleForm.category || 'logic',
      rules: ruleForm.rules?.filter(r => r.trim()) || [],
      testCases: ruleForm.testCases || [],
      status: ruleForm.status || 'draft',
      createdAt: selectedRule?.createdAt || now,
      updatedAt: now
    };

    let updatedRules: TestRule[];
    if (isCreating) {
      updatedRules = [...rules, newRule];
    } else {
      updatedRules = rules.map(r => r.id === newRule.id ? newRule : r);
    }

    saveRules(updatedRules);
    setIsCreating(false);
    setIsEditing(false);
    setSelectedRule(null);
    setRuleForm({
      title: '',
      description: '',
      category: 'logic',
      rules: [''],
      testCases: [],
      status: 'draft'
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    const updatedRules = rules.filter(r => r.id !== ruleId);
    saveRules(updatedRules);
    if (selectedRule?.id === ruleId) {
      setSelectedRule(null);
    }
  };

  const handleAddRuleLine = () => {
    setRuleForm({
      ...ruleForm,
      rules: [...(ruleForm.rules || []), '']
    });
  };

  const handleRemoveRuleLine = (index: number) => {
    const updatedRules = ruleForm.rules?.filter((_, i) => i !== index) || [];
    setRuleForm({
      ...ruleForm,
      rules: updatedRules.length > 0 ? updatedRules : ['']
    });
  };

  const handleUpdateRuleLine = (index: number, value: string) => {
    const updatedRules = [...(ruleForm.rules || [])];
    updatedRules[index] = value;
    setRuleForm({
      ...ruleForm,
      rules: updatedRules
    });
  };

  const toggleRuleExpansion = (ruleId: string) => {
    setExpandedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'logic':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'functionality':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'ui':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'data':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'integration':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'archived':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    const matchesSearch = !searchQuery.trim() || 
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <TestTube className="w-8 h-8 text-indigo-600" />
            Logical Flow Testing
          </h1>
          <p className="text-slate-600 mt-2">
            Test logic and functionality. Add rules to be followed by AI builder when creating modules.
          </p>
        </div>
        <Button
          onClick={handleCreateRule}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['all', 'logic', 'functionality', 'ui', 'data', 'integration'].map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <Card className="border-2 border-indigo-200 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{isCreating ? 'Create New Rule' : 'Edit Rule'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedRule(null);
                }}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </CardTitle>
            <CardDescription>
              Define rules that AI builder should follow when creating modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={ruleForm.title}
                onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                placeholder="e.g., Campaign Builder Validation Rules"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                placeholder="Describe what this rule set covers..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={ruleForm.category}
                  onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="logic">Logic</option>
                  <option value="functionality">Functionality</option>
                  <option value="ui">UI/UX</option>
                  <option value="data">Data</option>
                  <option value="integration">Integration</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={ruleForm.status}
                  onChange={(e) => setRuleForm({ ...ruleForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Rules *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRuleLine}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Rule
                </Button>
              </div>
              {ruleForm.rules?.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={rule}
                    onChange={(e) => handleUpdateRuleLine(index, e.target.value)}
                    placeholder={`Rule ${index + 1}: Enter a rule to follow...`}
                    rows={2}
                    className="flex-1"
                  />
                  {ruleForm.rules && ruleForm.rules.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRuleLine(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedRule(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveRule}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              >
                <Save className="w-5 h-5 mr-2" />
                {isCreating ? 'Create Rule' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <Card className="p-12 text-center">
            <TestTube className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Rules Found</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first rule to get started'}
            </p>
            {!searchQuery && filterCategory === 'all' && (
              <Button
                onClick={handleCreateRule}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Rule
              </Button>
            )}
          </Card>
        ) : (
          filteredRules.map((rule) => (
            <Card
              key={rule.id}
              className="hover:shadow-lg transition-all duration-200 border-2 hover:border-indigo-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{rule.title}</CardTitle>
                      <Badge className={getCategoryColor(rule.category)}>
                        {rule.category}
                      </Badge>
                      <Badge className={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                    </div>
                    {rule.description && (
                      <CardDescription className="mt-2">
                        {rule.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRuleExpansion(rule.id)}
                    >
                      {expandedRules.has(rule.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRule(rule)}
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedRules.has(rule.id) && (
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Rules ({rule.rules.length})
                    </h4>
                    <div className="space-y-2">
                      {rule.rules.map((r, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-slate-500 min-w-[3rem]">
                              {index + 1}.
                            </span>
                            <span className="text-sm text-slate-700 flex-1">{r}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {rule.testCases.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <Play className="w-5 h-5" />
                        Test Cases ({rule.testCases.length})
                      </h4>
                      <div className="space-y-2">
                        {rule.testCases.map((testCase) => (
                          <div
                            key={testCase.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">
                                {testCase.name}
                              </span>
                              <Badge
                                className={
                                  testCase.status === 'passed'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : testCase.status === 'failed'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }
                              >
                                {testCase.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                    Created: {new Date(rule.createdAt).toLocaleDateString()} | 
                    Updated: {new Date(rule.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

