'use client';

import React, { useState, useEffect } from 'react';
import { 
  authApi, 
  usersApi, 
  skillsApi, 
  matchesApi, 
  sessionsApi, 
  creditsApi, 
  notificationsApi, 
  onboardingApi,
  uploadApi,
  User,
  SkillLevel,
  SkillCatalogItem,
  SkillCategory
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlayCircle, CheckCircle2, XCircle, Clock, Database, Globe, Lock, UserCircle, MessageSquare, Bell, Star, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface APILog {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  latency?: number;
  data?: any;
  error?: string;
}

const STORAGE_KEY = 'skilo_api_debug_logs';

export default function APIDebugger() {
  const auth = useAuth();
  const [logs, setLogs] = useState<APILog[]>([]);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  
  // Load logs on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setLogs(hydrated);
      } catch (e) {
        console.error('Failed to load logs', e);
      }
    }
  }, []);

  // Save logs on change
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }
  }, [logs]);

  // Input states for specific tests
  const [userIdInput, setUserIdInput] = useState('');
  const [skillQuery, setSkillQuery] = useState('React');
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [matchIdInput, setMatchIdInput] = useState('');

  // Auth Form States
  const [loginEmail, setLoginEmail] = useState('zakariae@skilo.com');
  const [loginPassword, setLoginPassword] = useState('Password123');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regFirstName, setRegFirstName] = useState('John');
  const [regLastName, setRegLastName] = useState('Doe');
  const [regEmail, setRegEmail] = useState('john.doe@example.com');
  const [regPassword, setRegPassword] = useState('Skilo123!');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('Skilo123!');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);

  // Profile Update States
  const [upFirstName, setUpFirstName] = useState('');
  const [upLastName, setUpLastName] = useState('');
  const [upCity, setUpCity] = useState('');
  const [upBio, setUpBio] = useState('');
  const [upAvatarUrl, setUpAvatarUrl] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Upload States
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // New Skill States
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('tech');

  const addLog = (name: string): string => {
    const id = Math.random().toString(36).substring(7);
    const newLog: APILog = {
      id,
      name,
      status: 'pending',
      timestamp: new Date(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
    setActiveLogId(id);
    return id;
  };

  const updateLog = (id: string, updates: Partial<APILog>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  };

  const runTest = async (name: string, fn: () => Promise<any>, options?: { onAuthSuccess?: (data: any) => void }) => {
    const logId = addLog(name);
    const start = performance.now();
    try {
      const data = await fn();
      const end = performance.now();
      updateLog(logId, { 
        status: 'success', 
        data, 
        latency: Math.round(end - start) 
      });
      toast.success(`Success: ${name}`);
      
      // If this was an auth call (login/register), sync with context
      if (options?.onAuthSuccess) {
        options.onAuthSuccess(data);
      }
    } catch (err: any) {
      const end = performance.now();
      updateLog(logId, { 
        status: 'error', 
        error: err.message || 'Unknown error', 
        latency: Math.round(end - start) 
      });
      toast.error(`Error: ${name} - ${err.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setActiveLogId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const activeLog = logs.find(l => l.id === activeLogId);

  return (
    <div className="container mx-auto p-6 max-w-7xl h-[calc(100vh-2rem)] flex flex-col gap-6">
      <header className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skilo API Debugger</h1>
          <p className="text-muted-foreground">Test all backend endpoints and inspect live data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearLogs}>Clear Logs</Button>
          <Badge variant="outline" className="h-6">v1.0.0-debug</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* API Selection Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          <Tabs defaultValue="auth" className="flex-1 flex flex-col">
            <TabsList className="flex w-full flex-wrap p-2">
              <TabsTrigger value="auth" className="py-2"><Lock className="w-4 h-4 mr-2" /> Auth</TabsTrigger>
              <TabsTrigger value="users" className="py-2"><UserCircle className="w-4 h-4 mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="skills" className="py-2"><Globe className="w-4 h-4 mr-2" /> Skills</TabsTrigger>
              <TabsTrigger value="matches" className="py-2"><Database className="w-4 h-4 mr-2" /> Matches</TabsTrigger>
              <TabsTrigger value="sessions" className="py-2"><MessageSquare className="w-4 h-4 mr-2" /> Sessions</TabsTrigger>
              <TabsTrigger value="credits" className="py-2"><Clock className="w-4 h-4 mr-2" /> Credits</TabsTrigger>
              <TabsTrigger value="notifs" className="py-2"><Bell className="w-4 h-4 mr-2" /> Notifs</TabsTrigger>
              <TabsTrigger value="onboarding" className="py-2"><Star className="w-4 h-4 mr-2" /> Start</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto pr-4">
              <div className="space-y-4 pt-4 pb-8">
                {/* Auth Section */}
                <TabsContent value="auth" className="m-0 space-y-4">
                  <TestCard 
                    title="Session Me" 
                    description="Get current authenticated user session."
                    onRun={() => runTest('auth.me', () => authApi.me())}
                  />
                  <TestCard 
                    title="Refresh Token" 
                    description="Force a token refresh request."
                    onRun={() => runTest('auth.refresh', () => authApi.refresh())}
                  />
                  <TestCard 
                    title="Logout" 
                    description="Terminate session and clear tokens."
                    onRun={() => runTest('auth.logout', () => authApi.logout(), {
                      onAuthSuccess: () => auth.logout()
                    })}
                    variant="secondary"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Login Dialog Test */}
                    <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center border-dashed gap-1">
                          <Lock className="w-5 h-5 text-sky-500" />
                          <div className="text-xs font-bold">Interactive Login</div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>API Login Test</DialogTitle>
                          <DialogDescription>Submit credentials to test auth/login endpoint.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Email</label>
                            <Input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Password</label>
                            <div className="relative">
                              <Input 
                                type={showLoginPass ? "text" : "password"} 
                                value={loginPassword} 
                                onChange={e => setLoginPassword(e.target.value)} 
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowLoginPass(!showLoginPass)}
                              >
                                {showLoginPass ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            runTest('auth.login', () => authApi.login({ email: loginEmail, password: loginPassword }), {
                              onAuthSuccess: (data) => {
                                auth.login(data.access_token, data.user);
                                setIsLoginOpen(false);
                              }
                            });
                          }}>Execute Login</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Register Dialog Test */}
                    <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center border-dashed gap-1">
                          <UserCircle className="w-5 h-5 text-emerald-500" />
                          <div className="text-xs font-bold">Interactive Register</div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>API Register Test</DialogTitle>
                          <DialogDescription>Submit user data to test auth/register endpoint.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium">First Name</label>
                            <Input value={regFirstName} onChange={e => setRegFirstName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Last Name</label>
                            <Input value={regLastName} onChange={e => setRegLastName(e.target.value)} />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium">Email</label>
                            <Input value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Password</label>
                            <div className="relative">
                              <Input 
                                type={showRegPass ? "text" : "password"} 
                                value={regPassword} 
                                onChange={e => setRegPassword(e.target.value)} 
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowRegPass(!showRegPass)}
                              >
                                {showRegPass ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Confirm</label>
                            <div className="relative">
                              <Input 
                                type={showRegConfirmPass ? "text" : "password"} 
                                value={regPasswordConfirm} 
                                onChange={e => setRegPasswordConfirm(e.target.value)} 
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                              >
                                {showRegConfirmPass ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            runTest('auth.register', () => authApi.register({ 
                              firstName: regFirstName, 
                              lastName: regLastName, 
                              email: regEmail, 
                              password: regPassword,
                              passwordConfirm: regPasswordConfirm 
                            }), {
                              onAuthSuccess: (data) => {
                                auth.login(data.access_token, data.user);
                                setIsRegisterOpen(false);
                              }
                            });
                          }}>Execute Register</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>

                {/* Users Section */}
                <TabsContent value="users" className="m-0 space-y-4">
                  <TestCard 
                    title="Current User Profile" 
                    description="Get detailed profile of current user including skills."
                    onRun={() => runTest('users.me', () => usersApi.me())}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Update Profile Dialog */}
                    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-24 flex flex-col items-center justify-center border-dashed gap-1" onClick={() => {
                          // Pre-fill with current user data if available
                          if (auth.user) {
                            setUpFirstName(auth.user.firstName || '');
                            setUpLastName(auth.user.lastName || '');
                            setUpCity(auth.user.city || '');
                            setUpBio(auth.user.bio || '');
                            setUpAvatarUrl(auth.user.avatarUrl || '');
                          }
                        }}>
                          <UserCircle className="w-6 h-6 text-indigo-500" />
                          <div className="text-sm font-bold">Update Profile</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 px-2">Interactive update form</div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Update Profile</DialogTitle>
                          <DialogDescription>Modify your profile information.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium">First Name</label>
                            <Input value={upFirstName} onChange={e => setUpFirstName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Last Name</label>
                            <Input value={upLastName} onChange={e => setUpLastName(e.target.value)} />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium">City</label>
                            <Input value={upCity} onChange={e => setUpCity(e.target.value)} />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium">Avatar URL</label>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="https://..." 
                                value={upAvatarUrl} 
                                onChange={e => setUpAvatarUrl(e.target.value)} 
                                className="flex-1"
                              />
                              <div className="relative">
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setIsUploading(true);
                                    await runTest('uploadApi.avatar', () => uploadApi.avatar(file), {
                                      onAuthSuccess: (data) => {
                                        setUpAvatarUrl(data.avatarUrl);
                                      }
                                    });
                                    setIsUploading(false);
                                  }}
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-full"
                                  disabled={isUploading}
                                >
                                  {isUploading ? '...' : (
                                    <Globe className="w-4 h-4 text-sky-500" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Paste a URL or click the globe to upload a new image.
                            </p>
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-xs font-medium">Bio</label>
                            <textarea 
                              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={upBio} 
                              onChange={e => setUpBio(e.target.value)} 
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => {
                            const payload: any = {};
                            if (upFirstName.trim()) payload.firstName = upFirstName.trim();
                            if (upLastName.trim())  payload.lastName = upLastName.trim();
                            if (upCity.trim())      payload.city = upCity.trim();
                            if (upBio.trim())       payload.bio = upBio.trim();
                            if (upAvatarUrl.trim()) payload.avatarUrl = upAvatarUrl.trim();

                            runTest('users.updateMe', () => usersApi.updateMe(payload), {
                              onAuthSuccess: (updatedUser) => {
                                // Update local context if needed
                                setIsProfileOpen(false);
                              }
                            });
                          }}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="h-24 flex flex-col items-center justify-center border-dashed gap-1" onClick={() => runTest('users.list', () => usersApi.list())}>
                      <Database className="w-6 h-6 text-amber-500" />
                      <div className="text-sm font-bold">Fetch All Users</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 px-2">Paginated directory</div>
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="font-medium">Public Profile</div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="User ID..." 
                        value={userIdInput} 
                        onChange={e => setUserIdInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Button size="sm" onClick={() => runTest(`users.publicProfile(${userIdInput})`, () => usersApi.publicProfile(userIdInput))}>
                        Run
                      </Button>
                    </div>
                  </div>
                  <TestCard 
                    title="Update Profile (Test)" 
                    description="Changes bio to 'Debug session at ' + date."
                    onRun={() => runTest('users.updateMe', () => usersApi.updateMe({ bio: `Debug session at ${new Date().toISOString()}` }))}
                  />
                </TabsContent>

                {/* Skills Section */}
                <TabsContent value="skills" className="m-0 space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="font-medium">Search Skills</div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Search query..." 
                        value={skillQuery} 
                        onChange={e => setSkillQuery(e.target.value)}
                      />
                      <Button size="sm" onClick={() => runTest(`skills.search('${skillQuery}')`, () => skillsApi.search(skillQuery))}>
                        Search
                      </Button>
                    </div>
                  </div>

                  <TestCard 
                    title="List All Skills" 
                    description="Admin test: Retrieve full skills catalog."
                    onRun={() => runTest('skills.findAll', () => skillsApi.findAll())}
                  />

                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="text-sm font-medium">Propose New Skill</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="Skill Name (e.g. Rust)" 
                        value={newSkillName} 
                        onChange={e => setNewSkillName(e.target.value)}
                      />
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={newSkillCategory}
                        onChange={e => setNewSkillCategory(e.target.value as SkillCategory)}
                      >
                        <option value="tech">Tech</option>
                        <option value="languages">Languages</option>
                        <option value="arts">Arts</option>
                        <option value="business">Business</option>
                        <option value="sport">Sport</option>
                        <option value="cooking">Cooking</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => runTest('skills.create', () => skillsApi.create({ name: newSkillName, category: newSkillCategory }))}
                      disabled={!newSkillName}
                    >
                      Propose Skill
                    </Button>
                  </div>
                </TabsContent>

                {/* Matches Section */}
                <TabsContent value="matches" className="m-0 space-y-4">
                  <TestCard 
                    title="List Matches" 
                    description="Fetch all compatible matching profiles."
                    onRun={() => runTest('matches.list', () => matchesApi.list())}
                  />
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="font-medium">Match Details</div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Match ID..." 
                        value={matchIdInput} 
                        onChange={e => setMatchIdInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Button size="sm" onClick={() => runTest(`matches.get(${matchIdInput})`, () => matchesApi.get(matchIdInput))}>
                        Fetch
                      </Button>
                    </div>
                  </div>
                  <TestCard 
                    title="Recalculate Matches" 
                    description="Trigger algorithm to refresh matches."
                    onRun={() => runTest('matches.recalculate', () => matchesApi.recalculate())}
                  />
                </TabsContent>

                {/* Sessions Section */}
                <TabsContent value="sessions" className="m-0 space-y-4">
                  <TestCard 
                    title="Upcoming Sessions" 
                    description="List your scheduled exchange sessions."
                    onRun={() => runTest('sessions.list', () => sessionsApi.list({ tab: 'upcoming' }))}
                  />
                  <TestCard 
                    title="Past Sessions" 
                    description="List your completed exchange sessions."
                    onRun={() => runTest('sessions.list', () => sessionsApi.list({ tab: 'past' }))}
                  />
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <div className="font-medium">Session Details</div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Session ID..." 
                        value={sessionIdInput} 
                        onChange={e => setSessionIdInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Button size="sm" onClick={() => runTest(`sessions.get(${sessionIdInput})`, () => sessionsApi.get(sessionIdInput))}>
                        Fetch
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Credits Section */}
                <TabsContent value="credits" className="m-0 space-y-4">
                  <TestCard 
                    title="Credit Balance" 
                    description="Check your current Skilo credits."
                    onRun={() => runTest('credits.balance', () => creditsApi.balance())}
                  />
                  <TestCard 
                    title="Transaction History" 
                    description="Get logs of all credit movements."
                    onRun={() => runTest('credits.history', () => creditsApi.history())}
                  />
                </TabsContent>

                {/* Notifications Section */}
                <TabsContent value="notifs" className="m-0 space-y-4">
                  <TestCard 
                    title="All Notifications" 
                    description="Fetch all user notifications."
                    onRun={() => runTest('notifications.list', () => notificationsApi.list())}
                  />
                  <TestCard 
                    title="Mark All Read" 
                    description="Clear notification badges."
                    onRun={() => runTest('notifications.markAllRead', () => notificationsApi.markAllRead())}
                  />
                </TabsContent>

                {/* Onboarding Section */}
                <TabsContent value="onboarding" className="m-0 space-y-4">
                  <TestCard 
                    title="Onboarding Status" 
                    description="Check if profile setup is complete."
                    onRun={() => runTest('onboarding.status', () => onboardingApi.status())}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Console / Results Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 flex flex-col bg-slate-950 text-slate-50 border-slate-800">
            <CardHeader className="py-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-emerald-400" /> API LOGS
                </CardTitle>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              {/* History List */}
              <div className="border-b border-slate-800 h-1/3 overflow-auto">
                <div className="p-2 space-y-1">
                    {logs.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500 italic">
                        No requests recorded yet. Run a test to see results.
                      </div>
                    )}
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => setActiveLogId(log.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          activeLogId === log.id ? 'bg-slate-800' : 'hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {log.status === 'pending' && <Clock className="w-3 h-3 text-slate-400 animate-spin" />}
                          {log.status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {log.status === 'error' && <XCircle className="w-3 h-3 text-rose-500" />}
                          <span className="text-xs font-mono truncate">{log.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-[10px] text-slate-500">{log.latency ? `${log.latency}ms` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

              {/* Data Detail */}
              <div className="flex-1 overflow-auto flex flex-col bg-black/40">
                <div className="p-4">
                    {!activeLog && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 mt-10">
                        <Database className="w-8 h-8 opacity-20" />
                        <p className="text-xs">Select a log to view details</p>
                      </div>
                    )}
                    {activeLog && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-slate-400">RESPONSE DATA</span>
                          <Badge variant="outline" className={`text-[10px] h-5 ${
                            activeLog.status === 'success' ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'
                          }`}>
                            {activeLog.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {activeLog.error && (
                          <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded text-rose-400 text-xs font-mono">
                            Error: {activeLog.error}
                          </div>
                        )}

                        <pre className="text-xs font-mono text-emerald-200/90 whitespace-pre-wrap">
                          {activeLog.data ? JSON.stringify(activeLog.data, null, 2) : (activeLog.status === 'pending' ? '// Loading...' : '// No payload')}
                        </pre>
                      </div>
                    )}
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TestCard({ title, description, onRun, variant = 'default' }: { 
  title: string; 
  description: string; 
  onRun: () => void;
  variant?: 'default' | 'secondary' | 'danger'
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors shadow-none border-dashed bg-muted/10">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <Button onClick={onRun} size="sm" variant={variant === 'default' ? 'outline' : (variant === 'secondary' ? 'secondary' : 'destructive')}>
          Run
        </Button>
      </div>
    </Card>
  );
}
