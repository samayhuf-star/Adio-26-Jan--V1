import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Send, LifeBuoy, AlertCircle, CheckCircle2, 
    Clock, Sparkles, Filter, ChevronDown, ArrowLeft,
    Inbox, TrendingUp, Shield, Zap, Search, X, RefreshCw,
    AlertTriangle, Info, CircleDot, MessageCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { api } from '../utils/api';
import { notifications } from '../utils/notifications';

interface Ticket {
    id: string;
    subject: string;
    message: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    timestamp: string;
    createdAt?: string;
    adminReply?: string;
    adminRepliedAt?: string;
}

const priorityConfig = {
    Low: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: Info },
    Medium: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: AlertCircle },
    High: { color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', icon: AlertTriangle },
    Critical: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', icon: Zap },
};

const statusConfig = {
    'Open': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    'In Progress': { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    'Resolved': { color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
    'Closed': { color: 'bg-slate-50 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
};

const getTicketDate = (ticket: Ticket): string => 
    ticket.createdAt || ticket.timestamp || new Date().toISOString();

const safeStatus = (status: string) => 
    statusConfig[status as keyof typeof statusConfig] || statusConfig['Open'];

const safePriority = (priority: string) => 
    priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig['Medium'];

export const SupportPanel = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('Medium');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            try {
                const data = await api.get('/tickets/list');
                if (data.tickets) {
                    setTickets(data.tickets);
                } else {
                    const localTickets = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                    setTickets(localTickets);
                }
            } catch (apiError) {
                console.log('Loading tickets from local storage');
                const localTickets = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                localTickets.sort((a: Ticket, b: Ticket) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                setTickets(localTickets);
            }
        } catch (error) {
            try {
                const localTickets = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                localTickets.sort((a: Ticket, b: Ticket) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                setTickets(localTickets);
            } catch (e) {
                console.error("Failed to load tickets", e);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setIsSubmitting(true);
        
        const ticket: Ticket = {
            id: crypto.randomUUID(),
            subject,
            message,
            priority: priority as any,
            status: 'Open',
            timestamp: new Date().toISOString()
        };
        
        let saved = false;
        
        try {
            await api.post('/tickets/create', { subject, message, priority });
            saved = true;
            notifications.success('Ticket submitted successfully! Our team will respond soon.', {
                title: 'Ticket Submitted'
            });
        } catch (apiError) {
            console.log('API unavailable, trying local storage');
        }
        
        if (!saved) {
            try {
                const existing = JSON.parse(localStorage.getItem('support-tickets') || '[]');
                existing.unshift(ticket);
                localStorage.setItem('support-tickets', JSON.stringify(existing));
                saved = true;
                notifications.success('Ticket saved locally! Your ticket has been recorded.', {
                    title: 'Ticket Saved'
                });
            } catch (storageError) {
                console.log('localStorage unavailable');
            }
        }
        
        if (!saved) {
            setTickets(prev => [ticket, ...prev]);
            notifications.success('Ticket recorded!', { title: 'Ticket Recorded' });
        }
        
        setSubject('');
        setMessage('');
        setPriority('Medium');
        setShowNewTicketForm(false);
        await fetchTickets();
        setIsSubmitting(false);
    };

    const handleFillNow = () => {
        const templates = [
            { subject: 'Campaign export not working properly', message: `Hi Support Team,\n\nI'm having trouble exporting my campaign to CSV format.\n\nWhen I click the export button, the download doesn't start or the file is empty.\n\nCampaign name: My Test Campaign\nBrowser: Chrome\nSteps tried: Refreshed page, tried different browser\n\nPlease help me resolve this issue.`, priority: 'High' },
            { subject: 'Keyword suggestions not loading', message: `Hello,\n\nThe AI keyword suggestions feature isn't working for me.\n\nWhen I enter my business URL and click generate, nothing happens after a few seconds.\n\nURL I'm trying: example.com\nError message (if any): None visible\n\nThanks for looking into this!`, priority: 'Medium' },
            { subject: 'Question about subscription features', message: `Hi there,\n\nI'd like to know more about what's included in the Pro subscription.\n\nSpecifically, I'm interested in:\n- How many campaigns can I create?\n- Are there any limits on keyword generation?\n- What's the difference between Pro and Basic?\n\nLooking forward to your response.`, priority: 'Low' },
            { subject: 'Unable to save campaign draft', message: `Support Team,\n\nI've been working on a campaign for the past hour, but when I try to save it as a draft, I get an error.\n\nDetails:\n- Campaign type: Google Ads\n- Number of keywords: ~200\n- Browser: Firefox\n\nI don't want to lose my work. Please advise on how to proceed.`, priority: 'Critical' },
        ];
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setSubject(randomTemplate.subject);
        setMessage(randomTemplate.message);
        setPriority(randomTemplate.priority);
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesFilter = activeFilter === 'all' || ticket.status === activeFilter;
        const matchesSearch = searchQuery === '' || 
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved').length,
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffHrs < 1) return 'Just now';
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (selectedTicket) {
        return (
            <div className="max-w-4xl mx-auto p-6 animate-[slideInUp_0.3s_ease-out]">
                <button 
                    onClick={() => setSelectedTicket(null)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to all tickets
                </button>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={`${safeStatus(selectedTicket.status).color} px-3 py-1`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${safeStatus(selectedTicket.status).dot} mr-2 inline-block`}></span>
                                    {selectedTicket.status}
                                </Badge>
                                <Badge variant="outline" className={`${safePriority(selectedTicket.priority).color} px-3 py-1`}>
                                    {selectedTicket.priority}
                                </Badge>
                            </div>
                            <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(getTicketDate(selectedTicket)).toLocaleString()}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                    </div>

                    <div className="p-8">
                        <div className="flex gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                Y
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-slate-800">You</span>
                                    <span className="text-xs text-slate-400">{formatDate(getTicketDate(selectedTicket))}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-5 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
                                    {selectedTicket.message}
                                </div>
                            </div>
                        </div>

                        {selectedTicket.adminReply ? (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-slate-800">Support Team</span>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">Staff</Badge>
                                        {selectedTicket.adminRepliedAt && (
                                            <span className="text-xs text-slate-400">{formatDate(selectedTicket.adminRepliedAt)}</span>
                                        )}
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-5 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-emerald-100">
                                        {selectedTicket.adminReply}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Awaiting response from our support team. We typically respond within 24 hours.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <LifeBuoy className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Support Center</h1>
                    </div>
                    <p className="text-slate-500 ml-[52px] text-sm">Submit a ticket and our team will assist you within 24 hours.</p>
                </div>
                <Button
                    onClick={() => { setShowNewTicketForm(!showNewTicketForm); }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 px-5"
                >
                    {showNewTicketForm ? <X className="w-4 h-4 mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    {showNewTicketForm ? 'Cancel' : 'New Ticket'}
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
                {[
                    { label: 'Total Tickets', value: stats.total, icon: Inbox, gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
                    { label: 'Open', value: stats.open, icon: CircleDot, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
                    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
                    { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl border ${stat.border} p-4 lg:p-5 transition-all duration-200 hover:shadow-md group`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                                <stat.icon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className={`text-2xl lg:text-3xl font-bold ${stat.text} mb-0.5`}>{stat.value}</div>
                        <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {showNewTicketForm && (
                <div ref={formRef} className="mb-8 animate-[slideInUp_0.3s_ease-out]">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Send className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Create New Ticket</h3>
                                        <p className="text-xs text-slate-500">Describe your issue in detail for faster resolution</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleFillNow}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                >
                                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                    Auto-fill example
                                </Button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                                <div className="space-y-2">
                                    <label htmlFor="ticket-subject" className="text-sm font-medium text-slate-700">Subject</label>
                                    <Input 
                                        id="ticket-subject"
                                        placeholder="What's the issue about?" 
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-200 h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="ticket-priority" className="text-sm font-medium text-slate-700">Priority</label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger className="bg-white border-slate-200 h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Low">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                                    Low - General Question
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="Medium">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    Medium - Minor Issue
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="High">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                    High - Feature Broken
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="Critical">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                    Critical - System Down
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <label htmlFor="ticket-message" className="text-sm font-medium text-slate-700">Message</label>
                                <Textarea
                                    id="ticket-message" 
                                    placeholder="Please describe the issue in detail. Include steps to reproduce, expected behavior, and any error messages you've seen..." 
                                    className="min-h-[140px] bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-200 resize-none"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span>Your data is encrypted and secure</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowNewTicketForm(false)}
                                        className="text-slate-500"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 shadow-sm"
                                        disabled={isSubmitting || !subject || !message}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Submit Ticket
                                                <Send className="w-4 h-4" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="font-semibold text-slate-900 text-lg">My Tickets</h2>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs font-medium">
                                {filteredTickets.length}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input 
                                    aria-label="Search tickets"
                                    placeholder="Search tickets..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 w-[200px] bg-white border-slate-200 text-sm"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={fetchTickets} aria-label="Refresh tickets" className="text-slate-500 hover:text-indigo-600 h-9 w-9 p-0">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1">
                        {[
                            { key: 'all', label: 'All', count: tickets.length },
                            { key: 'Open', label: 'Open', count: stats.open },
                            { key: 'In Progress', label: 'In Progress', count: stats.inProgress },
                            { key: 'Resolved', label: 'Resolved', count: stats.resolved },
                        ].map((filter) => (
                            <button
                                key={filter.key}
                                aria-pressed={activeFilter === filter.key}
                                aria-label={`Filter by ${filter.label} (${filter.count})`}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5
                                    ${activeFilter === filter.key 
                                        ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                            >
                                {filter.label}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    activeFilter === filter.key ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-400 text-sm">Loading your tickets...</p>
                    </div>
                ) : filteredTickets.length > 0 ? (
                    <ScrollArea className="h-[520px]">
                        <div className="divide-y divide-slate-100">
                            {filteredTickets.map((ticket, index) => {
                                const PriorityIcon = safePriority(ticket.priority).icon;
                                return (
                                    <div 
                                        key={ticket.id} 
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Ticket: ${ticket.subject}, Status: ${ticket.status}, Priority: ${ticket.priority}`}
                                        onClick={() => setSelectedTicket(ticket)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTicket(ticket); }}}
                                        className="px-6 py-5 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-inset"
                                        style={{ animationDelay: `${index * 40}ms` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                ticket.priority === 'Critical' ? 'bg-red-100' :
                                                ticket.priority === 'High' ? 'bg-orange-100' :
                                                ticket.priority === 'Medium' ? 'bg-blue-100' : 'bg-slate-100'
                                            }`}>
                                                <PriorityIcon className={`w-4 h-4 ${
                                                    ticket.priority === 'Critical' ? 'text-red-600' :
                                                    ticket.priority === 'High' ? 'text-orange-600' :
                                                    ticket.priority === 'Medium' ? 'text-blue-600' : 'text-slate-500'
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5 mb-1.5">
                                                    <Badge variant="outline" className={`${safeStatus(ticket.status).color} text-[11px] px-2 py-0.5 font-medium`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${safeStatus(ticket.status).dot} mr-1.5 inline-block`}></span>
                                                        {ticket.status}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(getTicketDate(ticket))}
                                                    </span>
                                                    {ticket.adminReply && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                                                            <MessageCircle className="w-2.5 h-2.5 mr-1" />
                                                            Replied
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1 truncate">
                                                    {ticket.subject}
                                                </h3>
                                                <p className="text-slate-500 text-sm line-clamp-1">
                                                    {ticket.message}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 hidden sm:block">
                                                <Badge variant="outline" className={`${safePriority(ticket.priority).color} text-[11px] font-medium`}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="py-20 px-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-7 h-7 text-slate-300" />
                        </div>
                        <h3 className="font-semibold text-slate-700 mb-1">
                            {searchQuery || activeFilter !== 'all' ? 'No matching tickets' : 'No tickets yet'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">
                            {searchQuery || activeFilter !== 'all' 
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Submit your first support ticket and we\'ll be happy to help.'}
                        </p>
                        {!searchQuery && activeFilter === 'all' && (
                            <Button
                                onClick={() => setShowNewTicketForm(true)}
                                variant="outline"
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Create your first ticket
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { icon: Zap, title: 'Check help docs first', desc: 'Many questions are answered in our documentation.', color: 'text-amber-500', bg: 'bg-amber-50' },
                    { icon: AlertCircle, title: 'Include details', desc: 'Provide screenshots and steps to reproduce issues.', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: Clock, title: '24h response time', desc: 'We aim to respond to all tickets within 24 hours.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((tip) => (
                    <div key={tip.title} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-white">
                        <div className={`w-8 h-8 rounded-lg ${tip.bg} flex items-center justify-center flex-shrink-0`}>
                            <tip.icon className={`w-4 h-4 ${tip.color}`} />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-slate-800">{tip.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
