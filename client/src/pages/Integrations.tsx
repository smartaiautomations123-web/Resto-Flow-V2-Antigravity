import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Link2, Trash2, CheckCircle, XCircle, Webhook, BookOpen, ExternalLink } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

export default function Integrations() {
  const { user } = useAuth();
  const [slackWebhook, setSlackWebhook] = useState('');
  const [teamsWebhook, setTeamsWebhook] = useState('');
  const [qbAuthCode, setQbAuthCode] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvent, setNewWebhookEvent] = useState('order.created');
  const [toastApiKey, setToastApiKey] = useState('');
  const [toastRestaurantId, setToastRestaurantId] = useState('');
  const [squareToken, setSquareToken] = useState('');
  const [squareLocationId, setSquareLocationId] = useState('');
  const [xtraChefApiKey, setXtraChefApiKey] = useState('');

  const [showAdvancedToast, setShowAdvancedToast] = useState(false);
  const [showAdvancedSquare, setShowAdvancedSquare] = useState(false);

  const utils = trpc.useUtils();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('auth_success');
    const error = params.get('auth_error');
    if (success) {
      toast.success(`Successfully connected to ${success === 'square' ? 'Square' : 'Toast'} via OAuth!`);
      window.history.replaceState({}, '', '/integrations');
    }
    if (error) {
      toast.error(`Failed to authorize ${error}. Please try again.`);
      window.history.replaceState({}, '', '/integrations');
    }
  }, []);

  const handleToastOAuth = () => {
    window.location.href = `/api/auth/toast/callback?code=mock_oauth_flow&state=${user?.id}`;
  };

  const handleSquareOAuth = () => {
    window.location.href = `/api/auth/square/callback?code=mock_oauth_flow&state=${user?.id}`;
  };

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: integrations, isLoading } = trpc.settings.getIntegrations.useQuery();
  const { data: webhooks, isLoading: loadingWebhooks } = trpc.settings.getWebhooks.useQuery();

  // ─── Mutations ───────────────────────────────────────────────────────────
  const slackMut = trpc.settings.createSlackIntegration.useMutation({
    onSuccess: () => { toast.success('Slack integration connected'); setSlackWebhook(''); utils.settings.getIntegrations.invalidate(); },
    onError: () => toast.error('Failed to connect Slack'),
  });
  const teamsMut = trpc.settings.createTeamsIntegration.useMutation({
    onSuccess: () => { toast.success('Microsoft Teams integration connected'); setTeamsWebhook(''); utils.settings.getIntegrations.invalidate(); },
    onError: () => toast.error('Failed to connect Teams'),
  });
  const qbMut = trpc.settings.createQuickBooksIntegration.useMutation({
    onSuccess: () => { toast.success('QuickBooks integration connected'); setQbAuthCode(''); utils.settings.getIntegrations.invalidate(); },
    onError: () => toast.error('Failed to connect QuickBooks'),
  });
  const webhookMut = trpc.settings.createWebhook.useMutation({
    onSuccess: () => { toast.success('Webhook created'); setNewWebhookUrl(''); utils.settings.getWebhooks.invalidate(); },
    onError: () => toast.error('Failed to create webhook'),
  });
  const deleteMut = trpc.settings.deleteIntegration.useMutation({
    onSuccess: () => { toast.success('Integration removed'); utils.settings.getIntegrations.invalidate(); utils.settings.getWebhooks.invalidate(); },
    onError: () => toast.error('Failed to remove integration'),
  });

  const toastMut = trpc.settings.createToastIntegration.useMutation({
    onSuccess: () => { toast.success('Toast POS connected'); setToastApiKey(''); setToastRestaurantId(''); utils.settings.getIntegrations.invalidate(); },
    onError: () => toast.error('Failed to connect Toast'),
  });
  const squareMut = trpc.settings.createSquareIntegration.useMutation({
    onSuccess: () => { toast.success('Square POS connected'); setSquareToken(''); setSquareLocationId(''); utils.settings.getIntegrations.invalidate(); },
    onError: () => toast.error('Failed to connect Square'),
  });
  const xtraMut = trpc.settings.createXtraChefIntegration.useMutation({
    onSuccess: () => { toast.success('xtraCHEF connected'); setXtraChefApiKey(''); utils.settings.getIntegrations.invalidate(); },
    onError: () => toast.error('Failed to connect xtraCHEF'),
  });

  const syncToastMut = trpc.sync.syncToastData.useMutation({
    onSuccess: () => toast.success('Toast sync completed successfully!'),
    onError: () => toast.error('Failed to sync Toast data'),
  });
  const syncSquareMut = trpc.sync.syncSquareData.useMutation({
    onSuccess: () => toast.success('Square sync completed successfully!'),
    onError: () => toast.error('Failed to sync Square data'),
  });
  const syncXtraMut = trpc.sync.syncXtraChefData.useMutation({
    onSuccess: () => toast.success('xtraCHEF sync completed successfully!'),
    onError: () => toast.error('Failed to sync xtraCHEF data'),
  });

  const StatusIcon = ({ active }: { active: boolean }) =>
    active ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">Connect RestoFlow to your existing tools and services</p>
      </div>

      <Tabs defaultValue="messaging" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto mb-6">
          <TabsTrigger value="pos">POS Systems</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        {/* ── POS Systems ─────────────────────────────────────────────────── */}
        <TabsContent value="pos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center text-lg font-bold font-serif">T</div>
                  <div>
                    <CardTitle>Toast POS</CardTitle>
                    <CardDescription>Sync menu items, prices, and orders directly from Toast</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations?.toast?.active ? 'default' : 'secondary'}>
                  {integrations?.toast?.active ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integrations?.toast?.active ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Connected to Toast POS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => syncToastMut.mutate()} disabled={syncToastMut.isPending}>
                          {syncToastMut.isPending ? 'Syncing...' : 'Force Sync'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate({ id: (integrations.toast as any).id })}>
                          <Trash2 className="w-3 h-3 mr-1" /> Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showAdvancedToast ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client ID (API Key)</Label>
                      <Input
                        value={toastApiKey}
                        onChange={e => setToastApiKey(e.target.value)}
                        placeholder="Enter Toast API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Restaurant ID</Label>
                      <Input
                        value={toastRestaurantId}
                        onChange={e => setToastRestaurantId(e.target.value)}
                        placeholder="Enter Restaurant ID"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="flex-1" onClick={() => toastMut.mutate({ apiKey: toastApiKey, restaurantId: toastRestaurantId })} disabled={!toastApiKey || !toastRestaurantId || toastMut.isPending}>
                      <Link2 className="w-4 h-4 mr-2" />{toastMut.isPending ? 'Connecting…' : 'Connect via API'}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAdvancedToast(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <Button onClick={handleToastOAuth} className="w-full bg-[#FF6A00] hover:bg-[#E55F00] text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to Toast POS
                  </Button>
                  <Button variant="link" size="sm" onClick={() => setShowAdvancedToast(true)} className="text-xs text-muted-foreground self-center">
                    Advanced: Use API Key Instead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-xl flex items-center justify-center">■</div>
                  <div>
                    <CardTitle>Square POS</CardTitle>
                    <CardDescription>Keep your local menu and customers in sync with Square</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations?.square?.active ? 'default' : 'secondary'}>
                  {integrations?.square?.active ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integrations?.square?.active ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Connected to Square POS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => syncSquareMut.mutate()} disabled={syncSquareMut.isPending}>
                          {syncSquareMut.isPending ? 'Syncing...' : 'Force Sync'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate({ id: (integrations.square as any).id })}>
                          <Trash2 className="w-3 h-3 mr-1" /> Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showAdvancedSquare ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        value={squareToken}
                        onChange={e => setSquareToken(e.target.value)}
                        placeholder="Enter Application Access Token"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location ID</Label>
                      <Input
                        value={squareLocationId}
                        onChange={e => setSquareLocationId(e.target.value)}
                        placeholder="Enter Location ID"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="flex-1" onClick={() => squareMut.mutate({ accessToken: squareToken, locationId: squareLocationId })} disabled={!squareToken || !squareLocationId || squareMut.isPending}>
                      <Link2 className="w-4 h-4 mr-2" />{squareMut.isPending ? 'Connecting…' : 'Connect via API'}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAdvancedSquare(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-2">
                  <Button onClick={handleSquareOAuth} className="w-full bg-[#111] hover:bg-black text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to Square POS
                  </Button>
                  <Button variant="link" size="sm" onClick={() => setShowAdvancedSquare(true)} className="text-xs text-muted-foreground self-center">
                    Advanced: Use Access Token Instead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inventory systems ───────────────────────────────────────────── */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg flex items-center justify-center">XC</div>
                  <div>
                    <CardTitle>xtraCHEF</CardTitle>
                    <CardDescription>Automatically sync ingredient costs and supplier invoices</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations?.xtra_chef?.active ? 'default' : 'secondary'}>
                  {integrations?.xtra_chef?.active ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integrations?.xtra_chef?.active ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Connected to xtraCHEF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => syncXtraMut.mutate()} disabled={syncXtraMut.isPending}>
                          {syncXtraMut.isPending ? 'Syncing...' : 'Force Sync'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate({ id: (integrations.xtra_chef as any).id })}>
                          <Trash2 className="w-3 h-3 mr-1" /> Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      value={xtraChefApiKey}
                      onChange={e => setXtraChefApiKey(e.target.value)}
                      placeholder="Enter xtraCHEF API Key"
                      type="password"
                    />
                  </div>
                  <Button onClick={() => xtraMut.mutate({ apiKey: xtraChefApiKey })} disabled={!xtraChefApiKey || xtraMut.isPending}>
                    <Link2 className="w-4 h-4 mr-2" />{xtraMut.isPending ? 'Connecting…' : 'Connect xtraCHEF'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Messaging ─────────────────────────────────────────────────── */}
        <TabsContent value="messaging" className="space-y-4">
          {/* Slack */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg">💬</div>
                  <div>
                    <CardTitle>Slack</CardTitle>
                    <CardDescription>Get order and alert notifications in Slack</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations?.slack?.active ? 'default' : 'secondary'}>
                  {integrations?.slack?.active ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integrations?.slack?.active ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Connected to Slack · Webhook active</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate({ id: (integrations.slack as any).id })}>
                    <Trash2 className="w-3 h-3 mr-1" /> Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Incoming Webhook URL</Label>
                    <Input
                      value={slackWebhook}
                      onChange={e => setSlackWebhook(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Create an Incoming Webhook in your Slack workspace settings.
                    </p>
                  </div>
                  <Button onClick={() => slackMut.mutate({ webhookUrl: slackWebhook })} disabled={!slackWebhook || slackMut.isPending}>
                    <Link2 className="w-4 h-4 mr-2" />{slackMut.isPending ? 'Connecting…' : 'Connect Slack'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Microsoft Teams */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🔷</div>
                  <div>
                    <CardTitle>Microsoft Teams</CardTitle>
                    <CardDescription>Receive operational alerts in Teams</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations?.teams?.active ? 'default' : 'secondary'}>
                  {integrations?.teams?.active ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integrations?.teams?.active ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Connected to Microsoft Teams · Webhook active</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate({ id: (integrations.teams as any).id })}>
                    <Trash2 className="w-3 h-3 mr-1" /> Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Teams Incoming Webhook URL</Label>
                    <Input
                      value={teamsWebhook}
                      onChange={e => setTeamsWebhook(e.target.value)}
                      placeholder="https://outlook.office.com/webhook/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Create a connector in your Teams channel settings.
                    </p>
                  </div>
                  <Button onClick={() => teamsMut.mutate({ webhookUrl: teamsWebhook })} disabled={!teamsWebhook || teamsMut.isPending}>
                    <Link2 className="w-4 h-4 mr-2" />{teamsMut.isPending ? 'Connecting…' : 'Connect Teams'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Accounting ────────────────────────────────────────────────── */}
        <TabsContent value="accounting" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">📊</div>
                  <div>
                    <CardTitle>QuickBooks Online</CardTitle>
                    <CardDescription>Sync sales, expenses, and invoices with QuickBooks</CardDescription>
                  </div>
                </div>
                <Badge variant={integrations?.quickbooks?.active ? 'default' : 'secondary'}>
                  {integrations?.quickbooks?.active ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integrations?.quickbooks?.active ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Connected to QuickBooks Online</span>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate({ id: (integrations.quickbooks as any).id })}>
                        <Trash2 className="w-3 h-3 mr-1" /> Disconnect
                      </Button>
                    </div>
                    {(integrations?.quickbooks as any)?.lastSyncedAt && (
                      <p className="text-xs text-muted-foreground mt-1">Last synced: {new Date((integrations?.quickbooks as any).lastSyncedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Authorization Code</Label>
                    <Input
                      value={qbAuthCode}
                      onChange={e => setQbAuthCode(e.target.value)}
                      placeholder="Paste the authorization code from QuickBooks..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Authorize RestoFlow in your QuickBooks developer dashboard and paste the code above.
                    </p>
                  </div>
                  <Button onClick={() => qbMut.mutate({ authCode: qbAuthCode })} disabled={!qbAuthCode || qbMut.isPending}>
                    <BookOpen className="w-4 h-4 mr-2" />{qbMut.isPending ? 'Connecting…' : 'Connect QuickBooks'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Webhooks ──────────────────────────────────────────────────── */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Webhooks</CardTitle>
              <CardDescription>Send real-time HTTP callbacks to any endpoint when events occur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-2">
                  <Label>Endpoint URL</Label>
                  <Input
                    value={newWebhookUrl}
                    onChange={e => setNewWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Select value={newWebhookEvent} onValueChange={setNewWebhookEvent}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order.created">order.created</SelectItem>
                      <SelectItem value="order.completed">order.completed</SelectItem>
                      <SelectItem value="order.cancelled">order.cancelled</SelectItem>
                      <SelectItem value="payment.received">payment.received</SelectItem>
                      <SelectItem value="reservation.created">reservation.created</SelectItem>
                      <SelectItem value="stock.low">stock.low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => webhookMut.mutate({ url: newWebhookUrl, event: newWebhookEvent })} disabled={!newWebhookUrl || webhookMut.isPending}>
                <Webhook className="w-4 h-4 mr-2" />{webhookMut.isPending ? 'Creating…' : 'Add Webhook'}
              </Button>

              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-medium">Active Webhooks</h3>
                {loadingWebhooks && <div className="text-sm text-muted-foreground">Loading…</div>}
                {(!webhooks || webhooks.length === 0) && !loadingWebhooks && (
                  <p className="text-sm text-muted-foreground text-center py-4">No webhooks configured yet.</p>
                )}
                {webhooks?.map((wh: any) => (
                  <div key={wh.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-mono text-xs">{wh.webhookUrl}</p>
                      <p className="text-xs text-muted-foreground">
                        Event: {wh.config ? (JSON.parse(wh.config).event ?? 'all') : 'all'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ id: wh.id })}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Status ────────────────────────────────────────────────────── */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>Overview of all connected services</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-3">
                  {[
                    { name: 'Slack', description: 'Message notifications', active: !!integrations?.slack?.active },
                    { name: 'Microsoft Teams', description: 'Team collaboration alerts', active: !!integrations?.teams?.active },
                    { name: 'QuickBooks', description: 'Accounting sync', active: !!integrations?.quickbooks?.active },
                    { name: 'Toast POS', description: 'Point of Sale sync', active: !!integrations?.toast?.active },
                    { name: 'Square POS', description: 'Point of Sale sync', active: !!integrations?.square?.active },
                    { name: 'xtraCHEF', description: 'Inventory management', active: !!integrations?.xtra_chef?.active },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon active={item.active} />
                        <Badge variant={item.active ? 'default' : 'secondary'}>
                          {item.active ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Custom Webhooks</p>
                      <p className="text-xs text-muted-foreground">{webhooks?.length ?? 0} active endpoint(s)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon active={(webhooks?.length ?? 0) > 0} />
                      <Badge variant={(webhooks?.length ?? 0) > 0 ? 'default' : 'secondary'}>
                        {(webhooks?.length ?? 0) > 0 ? `${webhooks!.length} Active` : 'None'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
