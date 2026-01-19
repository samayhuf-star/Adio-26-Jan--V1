import React, { useState } from 'react';
import { 
  ArrowLeft, Wand2, FileText, Clock, BookOpen, Download, 
  Copy, Check, Loader2, Settings, Image, Code, BarChart3,
  Quote, Target, Lightbulb, ChevronDown, ChevronUp, Eye, Send
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface BlogSection {
  title: string;
  content: string;
  imagePrompt?: string;
  codeExample?: string;
  wordCount: number;
}

interface GeneratedBlog {
  title: string;
  slug: string;
  metaDescription: string;
  introduction: string;
  sections: BlogSection[];
  caseStudy: string;
  tips: string;
  conclusion: string;
  callToAction: string;
  fullContent: string;
  wordCount: number;
  readingTime: number;
  imagePrompts: string[];
  codeSnippets: string[];
  statistics: { stat: string; description: string; source: string }[];
}

interface BlogGeneratorProps {
  onBack?: () => void;
}

export default function BlogGenerator({ onBack }: BlogGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [contentType, setContentType] = useState<'how-to' | 'explainer' | 'tips' | 'case-study' | 'general'>('how-to');
  const [tone, setTone] = useState<'professional' | 'casual' | 'educational' | 'technical'>('professional');
  const [targetAudience, setTargetAudience] = useState<'beginners' | 'intermediate' | 'advanced' | 'general'>('general');
  const [includeCode, setIncludeCode] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);
  const [targetWordCount, setTargetWordCount] = useState(2000);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a blog topic');
      return;
    }
    
    if (topic.trim().length < 5) {
      setError('Topic must be at least 5 characters');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setError('Please log in to use the blog generator.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          topic: topic.trim(),
          keyword: keyword.trim() || topic.trim(),
          contentType,
          tone,
          targetAudience,
          includeCode,
          includeStats,
          targetWordCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog');
      }

      setGeneratedBlog(data.blog);
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedBlog) return;

    const blob = new Blob([generatedBlog.fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedBlog.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!generatedBlog) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setError('Please log in to publish blogs.');
      return;
    }
    
    setIsPublishing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: generatedBlog.title,
          slug: generatedBlog.slug,
          excerpt: generatedBlog.metaDescription,
          content: generatedBlog.fullContent,
          category: contentType,
          readTime: `${generatedBlog.readingTime} min`,
          author: 'Adiology Team',
          tags: [keyword || topic, contentType, targetAudience],
          metaDescription: generatedBlog.metaDescription,
          wordCount: generatedBlog.wordCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish blog');
      }

      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Publishing failed. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="h-6 w-6 text-primary" />
              AI Blog Generator
            </h1>
            <p className="text-muted-foreground">Generate comprehensive 2000+ word blog posts with AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blog Configuration</CardTitle>
                <CardDescription>Configure your blog post settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Blog Topic *</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., How to Optimize Google Ads Campaigns for Maximum ROI"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyword">Target Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="e.g., google ads optimization"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Primary keyword for SEO optimization
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={contentType} onValueChange={(v: any) => setContentType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="how-to">How-To Guide</SelectItem>
                        <SelectItem value="explainer">Explainer</SelectItem>
                        <SelectItem value="tips">Tips & Tricks</SelectItem>
                        <SelectItem value="case-study">Case Study</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginners">Beginners</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="general">General Audience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Collapsible open={showSettings} onOpenChange={setShowSettings}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Advanced Settings
                      </span>
                      {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Target Word Count</Label>
                      <Select 
                        value={targetWordCount.toString()} 
                        onValueChange={(v: string) => setTargetWordCount(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1500">1,500 words</SelectItem>
                          <SelectItem value="2000">2,000 words</SelectItem>
                          <SelectItem value="2500">2,500 words</SelectItem>
                          <SelectItem value="3000">3,000 words</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Code Examples</Label>
                        <p className="text-xs text-muted-foreground">Add relevant code snippets</p>
                      </div>
                      <Switch 
                        checked={includeCode} 
                        onCheckedChange={setIncludeCode}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Statistics</Label>
                        <p className="text-xs text-muted-foreground">Add data-backed insights</p>
                      </div>
                      <Switch 
                        checked={includeStats} 
                        onCheckedChange={setIncludeStats}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Blog Post...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Blog Post
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <p className="text-xs text-center text-muted-foreground">
                    This may take 1-2 minutes for a comprehensive post
                  </p>
                )}
              </CardContent>
            </Card>

            {generatedBlog && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Blog Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Word Count</span>
                    <Badge variant="secondary">{generatedBlog.wordCount.toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Reading Time</span>
                    <Badge variant="secondary">{generatedBlog.readingTime} min</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sections</span>
                    <Badge variant="secondary">{generatedBlog.sections.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Image Prompts</span>
                    <Badge variant="secondary">{generatedBlog.imagePrompts.length}</Badge>
                  </div>
                  {generatedBlog.codeSnippets.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Code Examples</span>
                      <Badge variant="secondary">{generatedBlog.codeSnippets.length}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {!generatedBlog ? (
              <Card className="h-full min-h-[500px] flex items-center justify-center">
                <CardContent className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Blog Generated Yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Enter a topic and configure your settings to generate a comprehensive blog post
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-lg">{generatedBlog.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {generatedBlog.metaDescription}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(generatedBlog.fullContent)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handlePublish}
                      disabled={isPublishing || publishSuccess}
                      className={publishSuccess ? 'bg-green-600 hover:bg-green-600' : ''}
                    >
                      {isPublishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : publishSuccess ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="sections">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Sections
                      </TabsTrigger>
                      <TabsTrigger value="images">
                        <Image className="h-4 w-4 mr-2" />
                        Images
                      </TabsTrigger>
                      <TabsTrigger value="markdown">
                        <Code className="h-4 w-4 mr-2" />
                        Markdown
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="preview" className="mt-4">
                      <ScrollArea className="h-[600px] pr-4">
                        <article className="prose prose-sm dark:prose-invert max-w-none">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: markdownToHtml(generatedBlog.fullContent) 
                            }} 
                          />
                        </article>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="sections" className="mt-4">
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-3">
                          <Card className="border-dashed">
                            <CardHeader className="py-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary">Introduction</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {countWords(generatedBlog.introduction)} words
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2 text-sm text-muted-foreground line-clamp-3">
                              {generatedBlog.introduction.replace(/[#*]/g, '')}
                            </CardContent>
                          </Card>

                          {generatedBlog.sections.map((section, index) => (
                            <Card key={index} className="border-dashed">
                              <Collapsible 
                                open={expandedSections.has(index)}
                                onOpenChange={() => toggleSection(index)}
                              >
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="py-3 cursor-pointer hover:bg-muted/50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">Section {index + 1}</Badge>
                                        <span className="font-medium">{section.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          {section.wordCount} words
                                        </span>
                                        {expandedSections.has(index) ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </div>
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <CardContent className="pt-0 text-sm">
                                    <div 
                                      className="prose prose-sm dark:prose-invert max-w-none"
                                      dangerouslySetInnerHTML={{ 
                                        __html: markdownToHtml(section.content) 
                                      }} 
                                    />
                                  </CardContent>
                                </CollapsibleContent>
                              </Collapsible>
                            </Card>
                          ))}

                          <Card className="border-dashed border-primary/50">
                            <CardHeader className="py-3">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-primary">Case Study</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {countWords(generatedBlog.caseStudy)} words
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2 text-sm text-muted-foreground line-clamp-3">
                              {generatedBlog.caseStudy.replace(/[#*]/g, '').substring(0, 200)}...
                            </CardContent>
                          </Card>

                          <Card className="border-dashed border-green-500/50">
                            <CardHeader className="py-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  <Lightbulb className="h-3 w-3 mr-1" />
                                  Tips & Best Practices
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {countWords(generatedBlog.tips)} words
                                </span>
                              </div>
                            </CardHeader>
                          </Card>

                          <Card className="border-dashed">
                            <CardHeader className="py-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary">Conclusion + CTA</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {countWords(generatedBlog.conclusion + generatedBlog.callToAction)} words
                                </span>
                              </div>
                            </CardHeader>
                          </Card>
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="images" className="mt-4">
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            Use these AI-generated prompts to create images for your blog post:
                          </p>
                          {generatedBlog.imagePrompts.map((prompt, index) => (
                            <Card key={index}>
                              <CardHeader className="py-3">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline">
                                    <Image className="h-3 w-3 mr-1" />
                                    Image {index + 1}
                                  </Badge>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleCopy(prompt)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="py-2">
                                <p className="text-sm">{prompt}</p>
                              </CardContent>
                            </Card>
                          ))}

                          {generatedBlog.statistics.length > 0 && (
                            <div className="mt-6">
                              <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Statistics Included
                              </h3>
                              {generatedBlog.statistics.map((stat, index) => (
                                <Card key={index} className="mb-2">
                                  <CardContent className="py-3">
                                    <div className="flex items-start gap-3">
                                      <div className="text-2xl font-bold text-primary">{stat.stat}</div>
                                      <div>
                                        <p className="text-sm">{stat.description}</p>
                                        <p className="text-xs text-muted-foreground">Source: {stat.source}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="markdown" className="mt-4">
                      <ScrollArea className="h-[600px]">
                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                          {generatedBlog.fullContent}
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(markdown: string): string {
  let html = escapeHtml(markdown)
    .replace(/^### (.*)$/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*)$/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*)$/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*)$/gim, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.*)$/gim, '<li class="ml-4">$1</li>')
    .replace(/\n\n/gim, '</p><p class="mb-3">')
    .replace(/```([\s\S]*?)```/gim, (_, code) => {
      return `<pre class="bg-muted p-3 rounded-md my-3 overflow-x-auto"><code class="text-sm">${code.trim()}</code></pre>`;
    })
    .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n/gim, '<br/>');

  html = `<p class="mb-3">${html}</p>`;
  
  html = html.replace(/(<li[^>]*>)/g, '<ul class="list-disc mb-3">$1').replace(/<\/li>(?!\s*<li)/g, '</li></ul>');
  html = html.replace(/<ul[^>]*>\s*<ul/g, '<ul').replace(/<\/ul>\s*<\/ul>/g, '</ul>');
  
  return html;
}
