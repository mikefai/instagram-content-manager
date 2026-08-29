import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Users, TrendingUp, Target, Lightbulb, 
  FileText, BarChart3, Settings, Bell, Plus, Search, Filter, 
  Edit3, Trash2, CheckCircle, XCircle, PlayCircle, PauseCircle, 
  Repeat, Send, Eye, Heart, MessageSquare, Share2, Bookmark, 
  Image, Video, Mic, Type, Link, Hash, PieChart, LineChart, AreaChart
} from 'nucleo-sharp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import {
  LineChart as LineChartComponent, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart as BarChartComponent, Bar, PieChart as PieChartComponent, 
  Pie, Cell, AreaChart as AreaChartComponent, Area
} from 'recharts';

// Types
interface ContentPost {
  id: string;
  title: string;
  type: 'image' | 'video' | 'reel' | 'story' | 'carousel' | 'live';
  caption: string;
  hashtags: string[];
  scheduledDate: Date;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  targetAudience: string[];
  campaignId?: string;
  createdAt: Date;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'paused';
  budget: number;
  targetAudience: string[];
  goals: string[];
  contentCount: number;
  reach: number;
  engagementRate: number;
}

interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  demographics: { ageRange: string; location: string; language: string; interests: string[] };
  engagement: { avgLikes: number; avgComments: number; avgShares: number };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  actions: string[];
  isActive: boolean;
  createdAt: Date;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered: Date | null;
}

interface ContentIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  potentialReach: number;
  estimatedEngagement: number;
  status: 'new' | 'approved' | 'rejected' | 'implemented';
  createdAt: Date;
}
// Helper functions
const formatDate = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? 'Invalid Date' : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

const STORAGE_KEYS = {
  POSTS: 'lb_posts_v1',
  CAMPAIGNS: 'lb_campaigns_v1',
  AUDIENCE: 'lb_audience_v1',
  WORKFLOWS: 'lb_workflows_v1',
  WEBHOOKS: 'lb_webhooks_v1',
  IDEAS: 'lb_ideas_v1',
  IS_INITIALIZED: 'lb_is_initialized_v1',
};

// Local storage helper
const loadStoredData = <T,>(key: string, fallback: T, reviveItem?: (item: any) => any): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (reviveItem && Array.isArray(parsed)) {
      return parsed.map(reviveItem) as unknown as T;
    }
    return parsed;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return fallback;
  }
};

const revivePost = (p: any): ContentPost => ({
  ...p,
  scheduledDate: p.scheduledDate ? new Date(p.scheduledDate) : new Date(),
  createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
});

const reviveCampaign = (c: any): Campaign => ({
  ...c,
  startDate: c.startDate ? new Date(c.startDate) : new Date(),
  endDate: c.endDate ? new Date(c.endDate) : new Date(),
});

const reviveWorkflow = (w: any): Workflow => ({
  ...w,
  createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
});

const reviveWebhook = (wh: any): Webhook => ({
  ...wh,
  lastTriggered: wh.lastTriggered ? new Date(wh.lastTriggered) : null,
});

const reviveIdea = (i: any): ContentIdea => ({
  ...i,
  createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
});

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'archived': return 'bg-purple-100 text-purple-800';
    case 'active': return 'bg-green-100 text-green-800';
    case 'planning': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'paused': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: string) => {
  const icons: Record<string, React.ReactElement> = {
    image: <Image className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    reel: <PlayCircle className="h-4 w-4" />,
    story: <Bookmark className="h-4 w-4" />,
    carousel: <Image className="h-4 w-4" />,
    live: <Mic className="h-4 w-4" />,
  };
  return icons[type] || <FileText className="h-4 w-4" />;
};

const getContentTypeColor = (type: string): string => {
  switch (type) {
    case 'image': return 'bg-blue-100 text-blue-800';
    case 'video': return 'bg-green-100 text-green-800';
    case 'reel': return 'bg-purple-100 text-purple-800';
    case 'story': return 'bg-pink-100 text-pink-800';
    case 'carousel': return 'bg-indigo-100 text-indigo-800';
    case 'live': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
// Initial Data
const initialAudienceSegments: AudienceSegment[] = [
  { id: 'a1', name: 'Beginner Learners', description: 'New to English learning', size: 15200, demographics: { ageRange: '18-25', location: 'Turkey, Europe', language: 'Turkish', interests: ['Basic English', 'Vocabulary'] }, engagement: { avgLikes: 45, avgComments: 8, avgShares: 3 } },
  { id: 'a2', name: 'Intermediate Learners', description: 'Moderate English skills', size: 28400, demographics: { ageRange: '20-35', location: 'Turkey, Europe', language: 'Turkish', interests: ['Conversation', 'Grammar'] }, engagement: { avgLikes: 89, avgComments: 15, avgShares: 5 } },
  { id: 'a3', name: 'Advanced Learners', description: 'Fluent speakers', size: 8700, demographics: { ageRange: '25-45', location: 'Turkey, Europe', language: 'Turkish', interests: ['Business English', 'Writing'] }, engagement: { avgLikes: 123, avgComments: 22, avgShares: 8 } },
  { id: 'a4', name: 'Teen Learners', description: 'Young learners', size: 12500, demographics: { ageRange: '13-19', location: 'Turkey', language: 'Turkish', interests: ['School English', 'Fun Learning'] }, engagement: { avgLikes: 67, avgComments: 12, avgShares: 4 } },
  { id: 'a5', name: 'Professionals', description: 'Business English', size: 6800, demographics: { ageRange: '30-50', location: 'Turkey', language: 'Turkish', interests: ['Business English', 'Meetings'] }, engagement: { avgLikes: 95, avgComments: 18, avgShares: 6 } },
];

const initialPosts: ContentPost[] = [
  { id: '1', title: 'English Learning Tips', type: 'carousel', caption: '5 essential tips to improve your English speaking skills', hashtags: ['#LearnEnglish', '#EnglishTips'], scheduledDate: new Date(Date.now() + 86400000), status: 'scheduled', reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0, targetAudience: ['Beginner Learners', 'Intermediate Learners'], createdAt: new Date() },
  { id: '2', title: 'Common English Mistakes', type: 'reel', caption: 'Stop making these common English mistakes!', hashtags: ['#EnglishMistakes', '#LearnEnglish'], scheduledDate: new Date(Date.now() - 86400000), status: 'published', reach: 15420, engagement: 1234, likes: 892, comments: 245, shares: 89, saves: 102, targetAudience: ['Intermediate Learners'], createdAt: new Date() },
  { id: '3', title: 'English Vocabulary Boost', type: 'image', caption: '10 powerful English words to add to your vocabulary', hashtags: ['#Vocabulary', '#EnglishWords'], scheduledDate: new Date(Date.now() - 259200000), status: 'published', reach: 12890, engagement: 987, likes: 654, comments: 123, shares: 45, saves: 87, targetAudience: ['Beginner Learners'], createdAt: new Date() },
];

const initialCampaigns: Campaign[] = [
  { id: 'c1', name: 'Summer English Challenge', description: '30-day challenge to improve English', startDate: new Date('2026-08-01'), endDate: new Date('2026-08-31'), status: 'active', budget: 5000, targetAudience: ['Beginner Learners', 'Intermediate Learners'], goals: ['Increase followers by 15%'], contentCount: 15, reach: 45200, engagementRate: 7.2 },
  { id: 'c2', name: 'Back to School English', description: 'Special program for students', startDate: new Date('2026-09-01'), endDate: new Date('2026-09-30'), status: 'planning', budget: 7500, targetAudience: ['Teen Learners'], goals: ['Acquire 2000+ new students'], contentCount: 20, reach: 0, engagementRate: 0 },
];
const initialWorkflows: Workflow[] = [
  { id: 'w1', name: 'New Post Notification', description: 'Notify team when new post is published', triggers: ['post_published'], actions: ['send_slack_message', 'send_email'], isActive: true, createdAt: new Date() },
  { id: 'w2', name: 'Engagement Alert', description: 'Alert when engagement exceeds threshold', triggers: ['high_engagement'], actions: ['create_task', 'notify_manager'], isActive: true, createdAt: new Date() },
];

const initialWebhooks: Webhook[] = [
  { id: 'wh1', name: 'Instagram API Webhook', url: 'https://api.instagram.com/webhooks/lbenglish', events: ['new_follower', 'new_comment'], isActive: true, lastTriggered: new Date() },
  { id: 'wh2', name: 'Slack Integration', url: 'https://hooks.slack.com/services/lbenglish', events: ['post_published'], isActive: true, lastTriggered: new Date(Date.now() - 86400000) },
];

const initialContentIdeas: ContentIdea[] = [
  { id: 'i1', title: 'English Idioms Series', description: 'Weekly series explaining common English idioms', category: 'Educational', potentialReach: 25000, estimatedEngagement: 2100, status: 'approved', createdAt: new Date() },
  { id: 'i2', title: 'Student Success Stories', description: 'Feature student testimonials', category: 'Social Proof', potentialReach: 35000, estimatedEngagement: 3200, status: 'new', createdAt: new Date() },
  { id: 'i3', title: 'Live Q&A Sessions', description: 'Weekly live sessions answering questions', category: 'Interactive', potentialReach: 40000, estimatedEngagement: 4500, status: 'approved', createdAt: new Date() },
];

// Main Component
const LBEnglishInstagramManager: React.FC = () => {
  const [posts, setPosts] = useState<ContentPost[]>(() =>
    loadStoredData(STORAGE_KEYS.POSTS, initialPosts, revivePost)
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    loadStoredData(STORAGE_KEYS.CAMPAIGNS, initialCampaigns, reviveCampaign)
  );
  const [audienceSegments, setAudienceSegments] = useState<AudienceSegment[]>(() =>
    loadStoredData(STORAGE_KEYS.AUDIENCE, initialAudienceSegments)
  );
  const [workflows, setWorkflows] = useState<Workflow[]>(() =>
    loadStoredData(STORAGE_KEYS.WORKFLOWS, initialWorkflows, reviveWorkflow)
  );
  const [webhooks, setWebhooks] = useState<Webhook[]>(() =>
    loadStoredData(STORAGE_KEYS.WEBHOOKS, initialWebhooks, reviveWebhook)
  );
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>(() =>
    loadStoredData(STORAGE_KEYS.IDEAS, initialContentIdeas, reviveIdea)
  );
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }, [posts]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIENCE, JSON.stringify(audienceSegments));
  }, [audienceSegments]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
  }, [workflows]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEBHOOKS, JSON.stringify(webhooks));
  }, [webhooks]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IDEAS, JSON.stringify(contentIdeas));
  }, [contentIdeas]);

  // Actions for data management
  const handleClearAllData = () => {
    setPosts([]);
    setCampaigns([]);
    setAudienceSegments([]);
    setWorkflows([]);
    setWebhooks([]);
    setContentIdeas([]);
    toast.success('All data has been cleared for personal usage');
  };

  const handleResetToSampleData = () => {
    setPosts(initialPosts);
    setCampaigns(initialCampaigns);
    setAudienceSegments(initialAudienceSegments);
    setWorkflows(initialWorkflows);
    setWebhooks(initialWebhooks);
    setContentIdeas(initialContentIdeas);
    toast.success('Sample data restored');
  };

  const handleExportData = () => {
    const data = {
      posts,
      campaigns,
      audienceSegments,
      workflows,
      webhooks,
      contentIdeas,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.posts) setPosts(data.posts.map(revivePost));
        if (data.campaigns) setCampaigns(data.campaigns.map(reviveCampaign));
        if (data.audienceSegments) setAudienceSegments(data.audienceSegments);
        if (data.workflows) setWorkflows(data.workflows.map(reviveWorkflow));
        if (data.webhooks) setWebhooks(data.webhooks.map(reviveWebhook));
        if (data.contentIdeas) setContentIdeas(data.contentIdeas.map(reviveIdea));
        toast.success('Data imported successfully');
      } catch (err) {
        toast.error('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
// Calculate metrics
  const metrics = useMemo(() => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const scheduledPosts = posts.filter(p => p.status === 'scheduled').length;
    const totalReach = posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.reach, 0);
    const totalEngagement = posts.filter(p => p.status === 'published').reduce((sum, p) => sum + p.engagement, 0);
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
    const totalAudience = audienceSegments.reduce((sum, a) => sum + a.size, 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const activeWebhooks = webhooks.filter(w => w.isActive).length;
    const activeWorkflows = workflows.filter(w => w.isActive).length;

    return { totalPosts, publishedPosts, scheduledPosts, totalReach, totalEngagement, engagementRate, totalAudience, activeCampaigns, activeWebhooks, activeWorkflows };
  }, [posts, campaigns, audienceSegments, webhooks, workflows]);

  // Dynamic Chart data
  const reachData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const monthsMap: Record<string, { reach: number; planned: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      monthsMap[mName] = { reach: 0, planned: 0 };
    }

    posts.forEach(p => {
      const date = p.scheduledDate instanceof Date ? p.scheduledDate : new Date(p.scheduledDate);
      if (isNaN(date.getTime())) return;
      const mName = monthNames[date.getMonth()];
      if (monthsMap[mName]) {
        if (p.status === 'published') {
          monthsMap[mName].reach += p.reach || 0;
        } else {
          monthsMap[mName].planned += 1000;
        }
      }
    });

    campaigns.forEach(c => {
      const date = c.startDate instanceof Date ? c.startDate : new Date(c.startDate);
      if (isNaN(date.getTime())) return;
      const mName = monthNames[date.getMonth()];
      if (monthsMap[mName]) {
        monthsMap[mName].reach += c.reach || 0;
      }
    });

    return Object.entries(monthsMap).map(([name, val]) => ({
      name,
      reach: val.reach,
      planned: val.planned,
    }));
  }, [posts, campaigns]);

  const engagementData = useMemo(() => [
    { name: 'Likes', value: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + (p.likes || 0), 0), fill: '#10B981' },
    { name: 'Comments', value: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + (p.comments || 0), 0), fill: '#3B82F6' },
    { name: 'Shares', value: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + (p.shares || 0), 0), fill: '#8B5CF6' },
    { name: 'Saves', value: posts.filter(p => p.status === 'published').reduce((sum, p) => sum + (p.saves || 0), 0), fill: '#F59E0B' },
  ], [posts]);

  const audienceData = useMemo(() => audienceSegments.map(a => ({ name: a.name, value: a.size })), [audienceSegments]);

  const contentTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAudience = selectedAudience.length === 0 || post.targetAudience.some(a => selectedAudience.includes(a));
      return matchesSearch && matchesAudience;
    });
  }, [posts, searchQuery, selectedAudience]);

  // Add new post
  const [newPost, setNewPost] = useState<Partial<ContentPost>>({ type: 'image', status: 'draft', targetAudience: [], hashtags: [] });
  const handleAddPost = () => {
    if (!newPost.title || !newPost.caption) { toast.error('Please fill in required fields'); return; }
    const post: ContentPost = {
      id: Date.now().toString(),
      title: newPost.title!,
      type: newPost.type || 'image',
      caption: newPost.caption!,
      hashtags: newPost.hashtags || [],
      scheduledDate: newPost.scheduledDate || new Date(),
      status: newPost.status || 'draft',
      reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0,
      targetAudience: newPost.targetAudience || [],
      createdAt: new Date(),
    };
    setPosts([...posts, post]);
    setNewPost({ type: 'image', status: 'draft', targetAudience: [], hashtags: [] });
    toast.success('Post added successfully');
  };
// Add new campaign
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({ status: 'planning', targetAudience: [], goals: [] });
  const handleAddCampaign = () => {
    if (!newCampaign.name || !newCampaign.description) { toast.error('Please fill in required fields'); return; }
    const campaign: Campaign = {
      id: 'c' + Date.now(),
      name: newCampaign.name!,
      description: newCampaign.description!,
      startDate: newCampaign.startDate || new Date(),
      endDate: newCampaign.endDate || new Date(Date.now() + 30 * 86400000),
      status: newCampaign.status || 'planning',
      budget: newCampaign.budget || 0,
      targetAudience: newCampaign.targetAudience || [],
      goals: newCampaign.goals || [],
      contentCount: 0, reach: 0, engagementRate: 0,
    };
    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ status: 'planning', targetAudience: [], goals: [] });
    toast.success('Campaign added successfully');
  };

  // Add new audience
  const [newAudience, setNewAudience] = useState<Partial<AudienceSegment>>({
    demographics: { ageRange: '', location: '', language: '', interests: [] },
    engagement: { avgLikes: 0, avgComments: 0, avgShares: 0 },
  });
  const handleAddAudience = () => {
    if (!newAudience.name) { toast.error('Please fill in required fields'); return; }
    const audience: AudienceSegment = {
      id: 'a' + Date.now(),
      name: newAudience.name!,
      description: newAudience.description || '',
      size: newAudience.size || 0,
      demographics: newAudience.demographics!,
      engagement: newAudience.engagement!,
    };
    setAudienceSegments([...audienceSegments, audience]);
    setNewAudience({
      demographics: { ageRange: '', location: '', language: '', interests: [] },
      engagement: { avgLikes: 0, avgComments: 0, avgShares: 0 },
    });
    toast.success('Audience segment added successfully');
  };
// Add new workflow
  const [newWorkflow, setNewWorkflow] = useState<Partial<Workflow>>({ triggers: [], actions: [], isActive: true });
  const handleAddWorkflow = () => {
    if (!newWorkflow.name) { toast.error('Please fill in required fields'); return; }
    const workflow: Workflow = {
      id: 'w' + Date.now(),
      name: newWorkflow.name!,
      description: newWorkflow.description || '',
      triggers: newWorkflow.triggers || [],
      actions: newWorkflow.actions || [],
      isActive: newWorkflow.isActive || true,
      createdAt: new Date(),
    };
    setWorkflows([...workflows, workflow]);
    setNewWorkflow({ triggers: [], actions: [], isActive: true });
    toast.success('Workflow added successfully');
  };

  // Add new webhook
  const [newWebhook, setNewWebhook] = useState<Partial<Webhook>>({ events: [], isActive: true });
  const handleAddWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) { toast.error('Please fill in required fields'); return; }
    const webhook: Webhook = {
      id: 'wh' + Date.now(),
      name: newWebhook.name!,
      url: newWebhook.url!,
      events: newWebhook.events || [],
      isActive: newWebhook.isActive || true,
      lastTriggered: null,
    };
    setWebhooks([...webhooks, webhook]);
    setNewWebhook({ events: [], isActive: true });
    toast.success('Webhook added successfully');
  };

  // Add new content idea
  const [newIdea, setNewIdea] = useState<Partial<ContentIdea>>({ status: 'new' });
  const handleAddIdea = () => {
    if (!newIdea.title || !newIdea.description) { toast.error('Please fill in required fields'); return; }
    const idea: ContentIdea = {
      id: 'i' + Date.now(),
      title: newIdea.title!,
      description: newIdea.description!,
      category: newIdea.category || 'Educational',
      potentialReach: newIdea.potentialReach || 0,
      estimatedEngagement: newIdea.estimatedEngagement || 0,
      status: newIdea.status || 'new',
      createdAt: new Date(),
    };
    setContentIdeas([...contentIdeas, idea]);
    setNewIdea({ status: 'new' });
    toast.success('Content idea added successfully');
  };

  // Update post status
  const handleUpdatePostStatus = (postId: string, newStatus: ContentPost['status']) => {
    setPosts(posts.map(post => post.id === postId ? { ...post, status: newStatus } : post));
    toast.success(`Post status updated to ${newStatus}`);
  };

  // Delete post
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
    toast.success('Post deleted successfully');
  };

  // Update idea status
  const handleUpdateIdeaStatus = (ideaId: string, newStatus: ContentIdea['status']) => {
    setContentIdeas(contentIdeas.map(idea => idea.id === ideaId ? { ...idea, status: newStatus } : idea));
    toast.success(`Idea status updated to ${newStatus}`);
  };
return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LB</span>
                </div>
                <span className="text-xl font-bold text-gray-900">L.B. English Co.</span>
              </div>
              <span className="text-sm text-muted-foreground">Instagram Content Manager</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Account & Data Settings</DialogTitle>
                    <DialogDescription>
                      Manage data persistence, demo data, and backups for personal usage.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Demo Data Removal / Toggle</h4>
                      <p className="text-xs text-muted-foreground">
                        Clear demo data to start fresh for your personal Instagram management, or restore default sample data anytime.
                      </p>
                      <div className="flex flex-col gap-2 pt-2">
                        <Button variant="destructive" size="sm" onClick={handleClearAllData}>
                          <Trash2 className="h-4 w-4 mr-2" /> Clear All Data (Personal Mode)
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleResetToSampleData}>
                          <Repeat className="h-4 w-4 mr-2" /> Restore Sample Demo Data
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Backup & Restore</h4>
                      <p className="text-xs text-muted-foreground">
                        Export your current posts, campaigns, and audience data to a JSON file or import a previous backup.
                      </p>
                      <div className="flex items-center space-x-2 pt-2">
                        <Button variant="secondary" size="sm" className="flex-1" onClick={handleExportData}>
                          Export Data
                        </Button>
                        <Label htmlFor="import-data-file" className="flex-1 cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                          Import Data
                          <input id="import-data-file" type="file" accept=".json" onChange={handleImportData} className="sr-only" />
                        </Label>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-muted-foreground">Manage your Instagram content strategy</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
{/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.totalReach)}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">{metrics.publishedPosts} published</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <Heart className="h-4 w-4 text-pink-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.engagementRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Average engagement</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Audience</CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(metrics.totalAudience)}</div>
                  <p className="text-xs text-muted-foreground">{audienceSegments.length} segments</p>
                </CardContent>
              </Card>
            </div>
{/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.scheduledPosts}</div>
                  <p className="text-xs text-muted-foreground">Ready to publish</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <Target className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
                  <p className="text-xs text-muted-foreground">Campaigns running</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
                  <Send className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeWebhooks}</div>
                  <p className="text-xs text-muted-foreground">{webhooks.length} total</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                  <Repeat className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeWorkflows}</div>
                  <p className="text-xs text-muted-foreground">{workflows.length} total</p>
                </CardContent>
              </Card>
            </div>
{/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reach Overview</CardTitle>
                  <CardDescription>Current vs Planned Reach</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChartComponent data={reachData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="reach" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Current Reach" />
                        <Area type="monotone" dataKey="planned" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Planned Reach" />
                      </AreaChartComponent>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Breakdown</CardTitle>
                  <CardDescription>Content Interaction Types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChartComponent>
                        <Pie
                          data={engagementData}
                          cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8"
                          dataKey="value" nameKey="name"
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {engagementData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChartComponent>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
{/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="ideas">Ideas</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChartComponent data={contentTypeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3B82F6" name="Count" />
                          </BarChartComponent>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Audience Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChartComponent>
                            <Pie
                              data={audienceData} cx="50%" cy="50%" labelLine={false} outerRadius={80}
                              fill="#8884d8" dataKey="value" nameKey="name"
                              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {audienceData.map((entry, index) => <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />)}
                            </Pie>
                            <Tooltip />
                          </PieChartComponent>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {posts.length === 0 && campaigns.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground flex flex-col items-center justify-center space-y-2">
                          <Clock className="h-8 w-8 text-gray-400" />
                          <p>No recent activity yet. Start by creating a post or campaign.</p>
                          <Button size="sm" variant="outline" onClick={() => setActiveTab('content')}>
                            Go to Content Manager
                          </Button>
                        </div>
                      ) : (
                        [...posts.slice(0, 3), ...campaigns.slice(0, 2)].sort((a, b) => {
                          const aDate = 'scheduledDate' in a ? a.scheduledDate : a.startDate;
                          const bDate = 'scheduledDate' in b ? b.scheduledDate : b.startDate;
                          const aTime = aDate instanceof Date ? aDate.getTime() : new Date(aDate).getTime();
                          const bTime = bDate instanceof Date ? bDate.getTime() : new Date(bDate).getTime();
                          return bTime - aTime;
                        }).map((item, index) => {
                          const isPost = 'type' in item;
                          return (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-full ${isPost ? 'bg-blue-100' : 'bg-green-100'}`}>
                                  {isPost ? <FileText className="h-4 w-4 text-blue-600" /> : <Target className="h-4 w-4 text-green-600" />}
                                </div>
                                <div>
                                  <p className="font-medium">{'title' in item ? item.title : item.name}</p>
                                  <p className="text-sm text-muted-foreground">{formatDate('scheduledDate' in item ? item.scheduledDate : item.startDate)}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                <span className="text-sm font-medium">{formatNumber(item.reach)}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
{/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Content Planning</h2>
                    <p className="text-muted-foreground">Manage and schedule your Instagram posts</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" /> <span>Add Post</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Post</DialogTitle>
                        <DialogDescription>Add a new Instagram post to your content calendar</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input id="title" value={newPost.title || ''} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} placeholder="Post title" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Content Type</Label>
                          <Select value={newPost.type} onValueChange={(value) => setNewPost({ ...newPost, type: value as ContentPost['type'] })}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="reel">Reel</SelectItem>
                              <SelectItem value="story">Story</SelectItem>
                              <SelectItem value="carousel">Carousel</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="caption">Caption *</Label>
                          <Textarea id="caption" value={newPost.caption || ''} onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })} placeholder="Post caption..." rows={4} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hashtags">Hashtags</Label>
                          <Input id="hashtags" value={newPost.hashtags?.join(', ') || ''} onChange={(e) => setNewPost({ ...newPost, hashtags: e.target.value.split(',').map(h => h.trim()).filter(Boolean) })} placeholder="#english, #learning" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="scheduledDate">Schedule Date</Label>
                          <Input id="scheduledDate" type="datetime-local" value={newPost.scheduledDate ? new Date(newPost.scheduledDate).toISOString().slice(0, 16) : ''} onChange={(e) => setNewPost({ ...newPost, scheduledDate: new Date(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select value={newPost.status} onValueChange={(value) => setNewPost({ ...newPost, status: value as ContentPost['status'] })}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Target Audience</Label>
                          <div className="flex flex-wrap gap-2">
                            {audienceSegments.map(segment => (
                              <Button key={segment.id} variant={newPost.targetAudience?.includes(segment.name) ? 'default' : 'outline'} size="sm" onClick={() => {
                                const current = newPost.targetAudience || [];
                                const newAudience = current.includes(segment.name) ? current.filter(a => a !== segment.name) : [...current, segment.name];
                                setNewPost({ ...newPost, targetAudience: newAudience });
                              }}>{segment.name}</Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewPost({ type: 'image', status: 'draft', targetAudience: [], hashtags: [] })}>Cancel</Button>
                        <Button onClick={handleAddPost}>Create Post</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
<Card>
                  <CardHeader>
                    <CardTitle>Content Calendar</CardTitle>
                    <CardDescription>{filteredPosts.length} posts found</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Schedule Date</TableHead>
                          <TableHead>Reach</TableHead>
                          <TableHead>Engagement</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{post.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{post.caption}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge className={getContentTypeColor(post.type)}><div className="flex items-center space-x-1">{getTypeIcon(post.type)}<span>{post.type}</span></div></Badge></TableCell>
                            <TableCell><Badge className={getStatusColor(post.status)}>{post.status}</Badge></TableCell>
                            <TableCell>{formatDate(post.scheduledDate)}</TableCell>
                            <TableCell>{formatNumber(post.reach)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span>{formatNumber(post.engagement)}</span>
                                <div className="flex space-x-1">
                                  <Heart className="h-3 w-3 text-pink-500" /><span className="text-xs">{post.likes}</span>
                                  <MessageSquare className="h-3 w-3 text-blue-500" /><span className="text-xs">{post.comments}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Select value={post.status} onValueChange={(value) => handleUpdatePostStatus(post.id, value as ContentPost['status'])} className="w-28 text-xs">
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeletePost(post.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="flex flex-col items-center space-y-4"><FileText className="h-12 w-12 text-muted-foreground" /><p className="text-muted-foreground">No posts found</p></div></TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
{/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Campaign Management</h2>
                    <p className="text-muted-foreground">Plan and track your marketing campaigns</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2"><Plus className="h-4 w-4" /> <span>Add Campaign</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Campaign</DialogTitle>
                        <DialogDescription>Add a new marketing campaign</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="campaignName">Campaign Name *</Label>
                          <Input id="campaignName" value={newCampaign.name || ''} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Campaign name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campaignStatus">Status</Label>
                          <Select value={newCampaign.status} onValueChange={(value) => setNewCampaign({ ...newCampaign, status: value as Campaign['status'] })}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planning">Planning</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="campaignDescription">Description *</Label>
                          <Textarea id="campaignDescription" value={newCampaign.description || ''} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="Campaign description..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input id="startDate" type="date" value={newCampaign.startDate ? new Date(newCampaign.startDate).toISOString().slice(0, 10) : ''} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: new Date(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input id="endDate" type="date" value={newCampaign.endDate ? new Date(newCampaign.endDate).toISOString().slice(0, 10) : ''} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: new Date(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget ($)</Label>
                          <Input id="budget" type="number" value={newCampaign.budget || 0} onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseFloat(e.target.value) || 0 })} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Target Audience</Label>
                          <div className="flex flex-wrap gap-2">
                            {audienceSegments.map(segment => (
                              <Button key={segment.id} variant={newCampaign.targetAudience?.includes(segment.name) ? 'default' : 'outline'} size="sm" onClick={() => {
                                const current = newCampaign.targetAudience || [];
                                const newAudience = current.includes(segment.name) ? current.filter(a => a !== segment.name) : [...current, segment.name];
                                setNewCampaign({ ...newCampaign, targetAudience: newAudience });
                              }}>{segment.name}</Button>
                            ))}
                          </div>
                        </div>
<div className="space-y-2 md:col-span-2">
                          <Label>Goals</Label>
                          <div className="flex flex-wrap gap-2">
                            <Input placeholder="Add a goal and press Enter" onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                setNewCampaign({ ...newCampaign, goals: [...(newCampaign.goals || []), e.currentTarget.value.trim()] });
                                e.currentTarget.value = '';
                              }
                            }} />
                            {newCampaign.goals?.map((goal, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center space-x-2">
                                <span>{goal}</span>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => setNewCampaign({ ...newCampaign, goals: newCampaign.goals?.filter((_, i) => i !== index) || [] })}><XCircle className="h-3 w-3" /></Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewCampaign({ status: 'planning', targetAudience: [], goals: [] })}>Cancel</Button>
                        <Button onClick={handleAddCampaign}>Create Campaign</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {campaigns.length === 0 ? (
                  <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <Target className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No campaigns created yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Start tracking your marketing campaigns, setting budgets, and monitoring reach.
                      </p>
                    </div>
                  </Card>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2"><Target className="h-5 w-5" /><span>{campaign.name}</span></CardTitle>
                            <CardDescription>{campaign.description}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duration:</span><span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Budget:</span><span>${formatNumber(campaign.budget)}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Content:</span><span>{campaign.contentCount} posts</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reach:</span><span className="font-medium">{formatNumber(campaign.reach)}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Engagement:</span><span className="font-medium">{campaign.engagementRate}%</span></div>
                        </div>
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Target Audience:</p>
                          <div className="flex flex-wrap gap-1">{campaign.targetAudience.map((a, i) => <Badge key={i} variant="outline" className="text-xs">{a}</Badge>)}</div>
                        </div>
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">Goals:</p>
                          <div className="flex flex-wrap gap-1">{campaign.goals.map((g, i) => <Badge key={i} variant="secondary" className="text-xs">{g}</Badge>)}</div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-between w-full">
                          <Progress value={campaign.status === 'completed' ? 100 : campaign.engagementRate * 2} className="h-2 w-32" />
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>
{/* Audience Tab */}
              <TabsContent value="audience" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Target Audience</h2>
                    <p className="text-muted-foreground">Define and manage your audience segments</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2"><Plus className="h-4 w-4" /> <span>Add Segment</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Audience Segment</DialogTitle>
                        <DialogDescription>Add a new audience segment to target</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="segmentName">Segment Name *</Label>
                          <Input id="segmentName" value={newAudience.name || ''} onChange={(e) => setNewAudience({ ...newAudience, name: e.target.value })} placeholder="Segment name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="segmentSize">Segment Size</Label>
                          <Input id="segmentSize" type="number" value={newAudience.size || 0} onChange={(e) => setNewAudience({ ...newAudience, size: parseInt(e.target.value) || 0 })} placeholder="0" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="segmentDescription">Description</Label>
                          <Textarea id="segmentDescription" value={newAudience.description || ''} onChange={(e) => setNewAudience({ ...newAudience, description: e.target.value })} placeholder="Segment description..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ageRange">Age Range</Label>
                          <Input id="ageRange" value={newAudience.demographics?.ageRange || ''} onChange={(e) => setNewAudience({ ...newAudience, demographics: { ...newAudience.demographics!, ageRange: e.target.value } })} placeholder="e.g., 18-25" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" value={newAudience.demographics?.location || ''} onChange={(e) => setNewAudience({ ...newAudience, demographics: { ...newAudience.demographics!, location: e.target.value } })} placeholder="e.g., Turkey" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language">Language</Label>
                          <Input id="language" value={newAudience.demographics?.language || ''} onChange={(e) => setNewAudience({ ...newAudience, demographics: { ...newAudience.demographics!, language: e.target.value } })} placeholder="e.g., Turkish" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="interests">Interests</Label>
                          <Input id="interests" value={newAudience.demographics?.interests?.join(', ') || ''} onChange={(e) => setNewAudience({ ...newAudience, demographics: { ...newAudience.demographics!, interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean) } })} placeholder="e.g., English, Learning" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewAudience({ demographics: { ageRange: '', location: '', language: '', interests: [] }, engagement: { avgLikes: 0, avgComments: 0, avgShares: 0 } })}>Cancel</Button>
                        <Button onClick={handleAddAudience}>Create Segment</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {audienceSegments.length === 0 ? (
                  <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No audience segments defined</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Define target audiences by age range, location, and interests for optimized content reach.
                      </p>
                    </div>
                  </Card>
                ) : (
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audienceSegments.map((segment) => (
                    <Card key={segment.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2"><Users className="h-5 w-5" /><span>{segment.name}</span></CardTitle>
                            <CardDescription>{segment.description}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-sm">{formatNumber(segment.size)} users</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Demographics</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-muted-foreground">Age:</span><span>{segment.demographics.ageRange}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Location:</span><span>{segment.demographics.location}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Language:</span><span>{segment.demographics.language}</span></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Interests</p>
                            <div className="flex flex-wrap gap-1">{segment.demographics.interests.map((i, idx) => <Badge key={idx} variant="outline" className="text-xs">{i}</Badge>)}</div>
                          </div>
                        </div>
<div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Engagement</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-blue-50 rounded"><Heart className="h-4 w-4 mx-auto text-blue-600 mb-1" /><p className="text-xs font-medium">{segment.engagement.avgLikes}</p><p className="text-xs text-muted-foreground">Likes</p></div>
                            <div className="text-center p-2 bg-green-50 rounded"><MessageSquare className="h-4 w-4 mx-auto text-green-600 mb-1" /><p className="text-xs font-medium">{segment.engagement.avgComments}</p><p className="text-xs text-muted-foreground">Comments</p></div>
                            <div className="text-center p-2 bg-purple-50 rounded"><Share2 className="h-4 w-4 mx-auto text-purple-600 mb-1" /><p className="text-xs font-medium">{segment.engagement.avgShares}</p><p className="text-xs text-muted-foreground">Shares</p></div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>
{/* Workflows Tab */}
              <TabsContent value="workflows" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Automation Workflows</h2>
                    <p className="text-muted-foreground">Automate repetitive tasks and processes</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2"><Plus className="h-4 w-4" /> <span>Add Workflow</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Workflow</DialogTitle>
                        <DialogDescription>Automate your content management processes</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="workflowName">Workflow Name *</Label>
                          <Input id="workflowName" value={newWorkflow.name || ''} onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })} placeholder="Workflow name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workflowDescription">Description</Label>
                          <Textarea id="workflowDescription" value={newWorkflow.description || ''} onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })} placeholder="Workflow description..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Triggers</Label>
                          <div className="flex flex-wrap gap-2">
                            {['post_published', 'content_submitted', 'high_engagement', 'new_comment', 'new_follower', 'campaign_started'].map(trigger => (
                              <Button key={trigger} variant={newWorkflow.triggers?.includes(trigger) ? 'default' : 'outline'} size="sm" onClick={() => {
                                const current = newWorkflow.triggers || [];
                                setNewWorkflow({ ...newWorkflow, triggers: current.includes(trigger) ? current.filter(t => t !== trigger) : [...current, trigger] });
                              }}>{trigger.replace('_', ' ')}</Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Actions</Label>
                          <div className="flex flex-wrap gap-2">
                            {['send_slack_message', 'send_email', 'create_task', 'notify_manager', 'request_review', 'update_database'].map(action => (
                              <Button key={action} variant={newWorkflow.actions?.includes(action) ? 'default' : 'outline'} size="sm" onClick={() => {
                                const current = newWorkflow.actions || [];
                                setNewWorkflow({ ...newWorkflow, actions: current.includes(action) ? current.filter(a => a !== action) : [...current, action] });
                              }}>{action.replace('_', ' ')}</Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="isActive" checked={newWorkflow.isActive || false} onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, isActive: checked as boolean })} />
                          <Label htmlFor="isActive">Active Workflow</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewWorkflow({ triggers: [], actions: [], isActive: true })}>Cancel</Button>
                        <Button onClick={handleAddWorkflow}>Create Workflow</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {workflows.length === 0 ? (
                  <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <Repeat className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No automation workflows configured</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Create custom rules to automatically trigger alerts, team notifications, or tasks.
                      </p>
                    </div>
                  </Card>
                ) : (
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflows.map((workflow) => (
                    <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2"><Repeat className="h-5 w-5" /><span>{workflow.name}</span></CardTitle>
                            <CardDescription>{workflow.description}</CardDescription>
                          </div>
                          <Badge className={workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{workflow.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Triggers:</p>
                          <div className="flex flex-wrap gap-1">{workflow.triggers.map((t, i) => <Badge key={i} variant="outline" className="text-xs">{t.replace('_', ' ')}</Badge>)}</div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Actions:</p>
                          <div className="flex flex-wrap gap-1">{workflow.actions.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a.replace('_', ' ')}</Badge>)}</div>
                        </div>
                        <p className="text-sm text-muted-foreground">Created: {formatDate(workflow.createdAt)}</p>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setWorkflows(workflows.map(w => w.id === workflow.id ? { ...w, isActive: !w.isActive } : w))}>{workflow.isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>
{/* Webhooks Tab */}
              <TabsContent value="webhooks" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Webhooks</h2>
                    <p className="text-muted-foreground">Integrate with external services</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2"><Plus className="h-4 w-4" /> <span>Add Webhook</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Webhook</DialogTitle>
                        <DialogDescription>Connect to external services and APIs</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="webhookName">Webhook Name *</Label>
                          <Input id="webhookName" value={newWebhook.name || ''} onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })} placeholder="Webhook name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="webhookUrl">URL *</Label>
                          <Input id="webhookUrl" type="url" value={newWebhook.url || ''} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })} placeholder="https://example.com/webhook" />
                        </div>
                        <div className="space-y-2">
                          <Label>Events</Label>
                          <div className="flex flex-wrap gap-2">
                            {['new_follower', 'new_comment', 'new_like', 'new_message', 'post_published', 'campaign_started', 'high_engagement'].map(event => (
                              <Button key={event} variant={newWebhook.events?.includes(event) ? 'default' : 'outline'} size="sm" onClick={() => {
                                const current = newWebhook.events || [];
                                setNewWebhook({ ...newWebhook, events: current.includes(event) ? current.filter(e => e !== event) : [...current, event] });
                              }}>{event.replace('_', ' ')}</Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="webhookActive" checked={newWebhook.isActive || false} onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, isActive: checked as boolean })} />
                          <Label htmlFor="webhookActive">Active Webhook</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewWebhook({ events: [], isActive: true })}>Cancel</Button>
                        <Button onClick={handleAddWebhook}>Create Webhook</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {webhooks.length === 0 ? (
                  <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <Send className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No webhooks registered</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Connect external APIs, Slack integrations, or external automation pipelines.
                      </p>
                    </div>
                  </Card>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {webhooks.map((webhook) => (
                    <Card key={webhook.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2"><Send className="h-5 w-5" /><span>{webhook.name}</span></CardTitle>
                            <CardDescription className="text-sm">{webhook.url}</CardDescription>
                          </div>
                          <Badge className={webhook.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{webhook.isActive ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Events:</p>
                          <div className="flex flex-wrap gap-1">{webhook.events.map((e, i) => <Badge key={i} variant="outline" className="text-xs">{e.replace('_', ' ')}</Badge>)}</div>
                        </div>
                        <p className="text-sm text-muted-foreground">Last triggered: {webhook.lastTriggered ? formatDate(webhook.lastTriggered) : 'Never'}</p>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setWebhooks(webhooks.map(w => w.id === webhook.id ? { ...w, isActive: !w.isActive } : w))}>{webhook.isActive ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>
{/* Ideas Tab */}
              <TabsContent value="ideas" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Content Ideas</h2>
                    <p className="text-muted-foreground">Brainstorm and track content ideas</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex items-center space-x-2"><Plus className="h-4 w-4" /> <span>Add Idea</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Content Idea</DialogTitle>
                        <DialogDescription>Submit a new content idea for consideration</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="ideaTitle">Title *</Label>
                          <Input id="ideaTitle" value={newIdea.title || ''} onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })} placeholder="Idea title" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ideaCategory">Category</Label>
                          <Select value={newIdea.category} onValueChange={(value) => setNewIdea({ ...newIdea, category: value })}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Educational">Educational</SelectItem>
                              <SelectItem value="Entertainment">Entertainment</SelectItem>
                              <SelectItem value="Social Proof">Social Proof</SelectItem>
                              <SelectItem value="Interactive">Interactive</SelectItem>
                              <SelectItem value="Promotional">Promotional</SelectItem>
                              <SelectItem value="Inspirational">Inspirational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ideaDescription">Description *</Label>
                          <Textarea id="ideaDescription" value={newIdea.description || ''} onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })} placeholder="Describe your idea..." rows={5} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="potentialReach">Potential Reach</Label>
                            <Input id="potentialReach" type="number" value={newIdea.potentialReach || 0} onChange={(e) => setNewIdea({ ...newIdea, potentialReach: parseInt(e.target.value) || 0 })} placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estimatedEngagement">Estimated Engagement</Label>
                            <Input id="estimatedEngagement" type="number" value={newIdea.estimatedEngagement || 0} onChange={(e) => setNewIdea({ ...newIdea, estimatedEngagement: parseInt(e.target.value) || 0 })} placeholder="0" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ideaStatus">Status</Label>
                          <Select value={newIdea.status} onValueChange={(value) => setNewIdea({ ...newIdea, status: value as ContentIdea['status'] })}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="implemented">Implemented</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewIdea({ status: 'new' })}>Cancel</Button>
                        <Button onClick={handleAddIdea}>Submit Idea</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {contentIdeas.length === 0 ? (
                  <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <Lightbulb className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold">No content ideas saved</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mt-1">
                        Brainstorm and store prospective ideas, calculate reach estimations, and track approvals.
                      </p>
                    </div>
                  </Card>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contentIdeas.map((idea) => (
                    <Card key={idea.id} className="hover:shadow-lg transition-shadow">
<CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2"><Lightbulb className="h-5 w-5" /><span>{idea.title}</span></CardTitle>
                            <CardDescription>{idea.category}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(idea.status)}>{idea.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Description:</p>
                          <p className="text-sm">{idea.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="text-center p-2 bg-blue-50 rounded"><Eye className="h-4 w-4 mx-auto text-blue-600 mb-1" /><p className="text-xs font-medium">{formatNumber(idea.potentialReach)}</p><p className="text-xs text-muted-foreground">Reach</p></div>
                          <div className="text-center p-2 bg-green-50 rounded"><Heart className="h-4 w-4 mx-auto text-green-600 mb-1" /><p className="text-xs font-medium">{formatNumber(idea.estimatedEngagement)}</p><p className="text-xs text-muted-foreground">Engagement</p></div>
                        </div>
                        <p className="text-xs text-muted-foreground">Submitted: {formatDate(idea.createdAt)}</p>
                      </CardContent>
                      <CardFooter>
                        <div className="flex justify-between w-full">
                          <Select value={idea.status} onValueChange={(value) => handleUpdateIdeaStatus(idea.id, value as ContentIdea['status'])} className="w-40">
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="implemented">Implemented</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>
</Tabs>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} L.B. English Co. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Instagram Content Manager v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LBEnglishInstagramManager;
