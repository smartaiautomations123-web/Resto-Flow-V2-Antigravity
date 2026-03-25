import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Save, Key, Trash2, Plus, RefreshCw, Shield, Mail, CreditCard, Truck, Receipt, Settings2, Database, Activity } from 'lucide-react';

// ─── Helper: controlled settings form state ───────────────────────────────────
function useSettingsForm<T extends Record<string, any>>(initial: T | null | undefined) {
  const [form, setForm] = useState<T>(initial as T ?? {} as T);
  useEffect(() => { if (initial) setForm(initial); }, [JSON.stringify(initial)]);
  const set = (key: keyof T, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  return { form, set };
}

// Helper to remove null values so Zod optional fields are happy (undefined)
function cleanPayload(data: any) {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null) cleaned[key] = value;
  }
  return cleaned;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('system');
  const [newApiKeyName, setNewApiKeyName] = useState('');

  const me = trpc.auth.me.useQuery();
  const userId = (me.data as any)?.id ?? 1;

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: systemData, isLoading: loadingSystem } = trpc.settings.getSystemSettings.useQuery();
  const { data: prefData, isLoading: loadingPrefs } = trpc.settings.getUserPreferences.useQuery({ userId });
  const { data: emailData, isLoading: loadingEmail } = trpc.settings.getEmailSettings.useQuery();
  const { data: paymentData, isLoading: loadingPayment } = trpc.settings.getPaymentSettings.useQuery();
  const { data: deliveryData, isLoading: loadingDelivery } = trpc.settings.getDeliverySettings.useQuery();
  const { data: receiptData, isLoading: loadingReceipt } = trpc.settings.getReceiptSettings.useQuery();
  const { data: securityData, isLoading: loadingSecurity } = trpc.settings.getSecuritySettings.useQuery();
  const { data: apiKeysData, isLoading: loadingApiKeys } = trpc.settings.listApiKeys.useQuery({ userId });
  const { data: auditData, isLoading: loadingAudit } = trpc.settings.getAuditLogSettings.useQuery();
  const { data: backupData, isLoading: loadingBackup } = trpc.settings.getBackupSettings.useQuery();

  // ─── Form state ─────────────────────────────────────────────────────────────
  const system = useSettingsForm(systemData);
  const prefs = useSettingsForm(prefData);
  const email = useSettingsForm(emailData);
  const payment = useSettingsForm(paymentData);
  const delivery = useSettingsForm(deliveryData);
  const receipt = useSettingsForm(receiptData);
  const security = useSettingsForm(securityData);
  const audit = useSettingsForm(auditData);
  const backup = useSettingsForm(backupData);

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const saveSystem = trpc.settings.updateSystemSettings.useMutation({
    onSuccess: () => { toast.success('System settings saved'); utils.settings.getSystemSettings.invalidate(); },
    onError: () => toast.error('Failed to save system settings'),
  });
  const savePrefs = trpc.settings.updateUserPreferences.useMutation({
    onSuccess: () => { toast.success('Preferences saved'); utils.settings.getUserPreferences.invalidate({ userId }); },
    onError: () => toast.error('Failed to save preferences'),
  });
  const saveEmail = trpc.settings.updateEmailSettings.useMutation({
    onSuccess: () => { toast.success('Email settings saved'); utils.settings.getEmailSettings.invalidate(); },
    onError: () => toast.error('Failed to save email settings'),
  });
  const testEmail = trpc.settings.testEmailSettings.useMutation({
    onSuccess: (r) => toast.success(r.message),
    onError: () => toast.error('Email test failed'),
  });
  const savePayment = trpc.settings.updatePaymentSettings.useMutation({
    onSuccess: () => { toast.success('Payment settings saved'); utils.settings.getPaymentSettings.invalidate(); },
    onError: () => toast.error('Failed to save payment settings'),
  });
  const saveDelivery = trpc.settings.updateDeliverySettings.useMutation({
    onSuccess: () => { toast.success('Delivery settings saved'); utils.settings.getDeliverySettings.invalidate(); },
    onError: () => toast.error('Failed to save delivery settings'),
  });
  const saveReceipt = trpc.settings.updateReceiptSettings.useMutation({
    onSuccess: () => { toast.success('Receipt settings saved'); utils.settings.getReceiptSettings.invalidate(); },
    onError: () => toast.error('Failed to save receipt settings'),
  });
  const saveSecurity = trpc.settings.updateSecuritySettings.useMutation({
    onSuccess: () => { toast.success('Security settings saved'); utils.settings.getSecuritySettings.invalidate(); },
    onError: () => toast.error('Failed to save security settings'),
  });
  const createApiKey = trpc.settings.createApiKey.useMutation({
    onSuccess: () => { toast.success('API key created'); utils.settings.listApiKeys.invalidate({ userId }); setNewApiKeyName(''); },
    onError: () => toast.error('Failed to create API key'),
  });
  const revokeApiKey = trpc.settings.revokeApiKey.useMutation({
    onSuccess: () => { toast.success('API key revoked'); utils.settings.listApiKeys.invalidate({ userId }); },
    onError: () => toast.error('Failed to revoke API key'),
  });
  const saveAudit = trpc.settings.updateAuditLogSettings.useMutation({
    onSuccess: () => { toast.success('Audit settings saved'); utils.settings.getAuditLogSettings.invalidate(); },
    onError: () => toast.error('Failed to save audit settings'),
  });
  const saveBackup = trpc.settings.updateBackupSettings.useMutation({
    onSuccess: () => { toast.success('Backup settings saved'); utils.settings.getBackupSettings.invalidate(); },
    onError: () => toast.error('Failed to save backup settings'),
  });
  const triggerBackup = trpc.settings.triggerManualBackup.useMutation({
    onSuccess: () => toast.success('Backup triggered successfully'),
    onError: () => toast.error('Failed to trigger backup'),
  });

  const handleCreateApiKey = () => {
    if (!newApiKeyName.trim()) { toast.error('Enter a name for the API key'); return; }
    const keyHash = `rflow_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    createApiKey.mutate({ userId, name: newApiKeyName.trim(), keyHash });
  };

  const tabs = [
    { value: 'system', label: 'System', icon: Settings2 },
    { value: 'preferences', label: 'Preferences', icon: Settings2 },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'payment', label: 'Payment', icon: CreditCard },
    { value: 'delivery', label: 'Delivery', icon: Truck },
    { value: 'receipt', label: 'Receipt', icon: Receipt },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'api', label: 'API Keys', icon: Key },
    { value: 'audit', label: 'Audit', icon: Activity },
    { value: 'backup', label: 'Backup', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings &amp; Configuration</h1>
        <p className="text-muted-foreground mt-2">Manage your restaurant's system configuration and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-2">
          {tabs.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── System Settings ─────────────────────────────────────────── */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Basic settings for your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSystem ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Restaurant Name</Label>
                      <Input value={system.form.restaurantName ?? ''} onChange={e => system.set('restaurantName', e.target.value)} placeholder="My Restaurant" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Email</Label>
                      <Input type="email" value={system.form.businessEmail ?? ''} onChange={e => system.set('businessEmail', e.target.value)} placeholder="info@restaurant.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Phone</Label>
                      <Input value={system.form.businessPhone ?? ''} onChange={e => system.set('businessPhone', e.target.value)} placeholder="+1 555-000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={system.form.timezone ?? 'UTC'} onValueChange={v => system.set('timezone', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={system.form.currency ?? 'USD'} onValueChange={v => system.set('currency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={system.form.language ?? 'en'} onValueChange={v => system.set('language', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input type="number" step="0.01" value={system.form.taxRate ?? ''} onChange={e => system.set('taxRate', e.target.value)} placeholder="8.5" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Address</Label>
                      <Input value={system.form.businessAddress ?? ''} onChange={e => system.set('businessAddress', e.target.value)} placeholder="123 Main St, City, State" />
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <h3 className="text-lg font-medium">Global Branding & Theme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Brand Color</Label>
                        <div className="flex gap-2">
                          <Input type="color" className="p-1 h-10 w-20" value={system.form.primaryColor ?? '#e11d48'} onChange={e => system.set('primaryColor', e.target.value)} />
                          <Input value={system.form.primaryColor ?? '#e11d48'} onChange={e => system.set('primaryColor', e.target.value)} placeholder="#e11d48" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Global Font Family</Label>
                        <Select value={system.form.fontFamily ?? 'Inter'} onValueChange={v => system.set('fontFamily', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter (Default)</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                            <SelectItem value="Outfit">Outfit</SelectItem>
                            <SelectItem value="Montserrat">Montserrat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Border Radius (rem)</Label>
                        <Input value={system.form.borderRadius ?? '0.5rem'} onChange={e => system.set('borderRadius', e.target.value)} placeholder="0.5rem" />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label>Restaurant Logo URL</Label>
                        <Input value={system.form.restaurantLogo ?? ''} onChange={e => system.set('restaurantLogo', e.target.value)} placeholder="https://example.com/logo.png" />
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => saveSystem.mutate(cleanPayload(system.form))} disabled={saveSystem.isPending}>
                    <Save className="w-4 h-4 mr-2" />{saveSystem.isPending ? 'Saving…' : 'Save System Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── User Preferences ─────────────────────────────────────────── */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>Customize your personal experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPrefs ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div><Label>Theme</Label><p className="text-xs text-muted-foreground">Display theme preference</p></div>
                      <Select value={prefs.form.theme ?? 'auto'} onValueChange={v => prefs.set('theme', v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Sidebar Collapsed</Label><p className="text-xs text-muted-foreground">Start with sidebar collapsed</p></div>
                      <Switch checked={!!prefs.form.sidebarCollapsed} onCheckedChange={v => prefs.set('sidebarCollapsed', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Compact Mode</Label><p className="text-xs text-muted-foreground">Denser UI layout</p></div>
                      <Switch checked={!!prefs.form.compactMode} onCheckedChange={v => prefs.set('compactMode', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Notifications</Label><p className="text-xs text-muted-foreground">Show in-app notifications</p></div>
                      <Switch checked={!!prefs.form.showNotifications} onCheckedChange={v => prefs.set('showNotifications', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Sound Alerts</Label><p className="text-xs text-muted-foreground">Play sounds for alerts</p></div>
                      <Switch checked={!!prefs.form.soundEnabled} onCheckedChange={v => prefs.set('soundEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Email Digest</Label><p className="text-xs text-muted-foreground">Receive email summaries</p></div>
                      <Select value={prefs.form.emailDigest ?? 'none'} onValueChange={v => prefs.set('emailDigest', v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={() => savePrefs.mutate({ userId, ...cleanPayload(prefs.form) })} disabled={savePrefs.isPending}>
                    <Save className="w-4 h-4 mr-2" />{savePrefs.isPending ? 'Saving…' : 'Save Preferences'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Email Settings ─────────────────────────────────────────────── */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure SMTP for notifications and campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingEmail ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SMTP Host</Label>
                      <Input value={email.form.smtpHost ?? ''} onChange={e => email.set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Port</Label>
                      <Input type="number" value={email.form.smtpPort ?? 587} onChange={e => email.set('smtpPort', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Username</Label>
                      <Input value={email.form.smtpUser ?? ''} onChange={e => email.set('smtpUser', e.target.value)} placeholder="user@gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Password</Label>
                      <Input type="password" value={email.form.smtpPassword ?? ''} onChange={e => email.set('smtpPassword', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>From Email</Label>
                      <Input type="email" value={email.form.fromEmail ?? ''} onChange={e => email.set('fromEmail', e.target.value)} placeholder="noreply@restaurant.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>From Name</Label>
                      <Input value={email.form.fromName ?? ''} onChange={e => email.set('fromName', e.target.value)} placeholder="Your Restaurant" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={!!email.form.isEnabled} onCheckedChange={v => email.set('isEnabled', v)} />
                    <Label>Enable Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={!!email.form.useTLS} onCheckedChange={v => email.set('useTLS', v)} />
                    <Label>Use TLS</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveEmail.mutate(cleanPayload(email.form))} disabled={saveEmail.isPending}>
                      <Save className="w-4 h-4 mr-2" />{saveEmail.isPending ? 'Saving…' : 'Save Email Settings'}
                    </Button>
                    <Button variant="outline" onClick={() => testEmail.mutate()} disabled={testEmail.isPending}>
                      {testEmail.isPending ? 'Testing…' : 'Test Connection'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payment Settings ──────────────────────────────────────────── */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
              <CardDescription>Configure payment gateways and processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPayment ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium">Stripe</p><p className="text-xs text-muted-foreground">Card processing via Stripe</p></div>
                        <Switch checked={!!payment.form.stripeEnabled} onCheckedChange={v => payment.set('stripeEnabled', v)} />
                      </div>
                      {payment.form.stripeEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Publishable Key</Label>
                            <Input value={payment.form.stripePublishableKey ?? ''} onChange={e => payment.set('stripePublishableKey', e.target.value)} placeholder="pk_live_..." />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Secret Key</Label>
                            <Input type="password" value={payment.form.stripeSecretKey ?? ''} onChange={e => payment.set('stripeSecretKey', e.target.value)} placeholder="sk_live_..." />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium">PayPal</p><p className="text-xs text-muted-foreground">PayPal checkout integration</p></div>
                        <Switch checked={!!payment.form.paypalEnabled} onCheckedChange={v => payment.set('paypalEnabled', v)} />
                      </div>
                      {payment.form.paypalEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Client ID</Label>
                            <Input value={payment.form.paypalClientId ?? ''} onChange={e => payment.set('paypalClientId', e.target.value)} placeholder="PayPal client ID..." />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Client Secret</Label>
                            <Input type="password" value={payment.form.paypalClientSecret ?? ''} onChange={e => payment.set('paypalClientSecret', e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={!!payment.form.cashPaymentEnabled} onCheckedChange={v => payment.set('cashPaymentEnabled', v)} />
                      <Label>Accept Cash Payments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={!!payment.form.checkPaymentEnabled} onCheckedChange={v => payment.set('checkPaymentEnabled', v)} />
                      <Label>Accept Check Payments</Label>
                    </div>
                  </div>
                  <Button onClick={() => savePayment.mutate(cleanPayload(payment.form))} disabled={savePayment.isPending}>
                    <Save className="w-4 h-4 mr-2" />{savePayment.isPending ? 'Saving…' : 'Save Payment Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Delivery Settings ─────────────────────────────────────────── */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Configuration</CardTitle>
              <CardDescription>Configure delivery options and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDelivery ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div><Label>Internal Delivery</Label><p className="text-xs text-muted-foreground">Own delivery drivers</p></div>
                      <Switch checked={!!delivery.form.internalDeliveryEnabled} onCheckedChange={v => delivery.set('internalDeliveryEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Third-Party Delivery</Label><p className="text-xs text-muted-foreground">Uber Eats, DoorDash, GrubHub etc.</p></div>
                      <Switch checked={!!delivery.form.thirdPartyDeliveryEnabled} onCheckedChange={v => delivery.set('thirdPartyDeliveryEnabled', v)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Delivery Fee ($)</Label>
                      <Input type="number" step="0.01" value={delivery.form.defaultDeliveryFee ?? ''} onChange={e => delivery.set('defaultDeliveryFee', e.target.value)} placeholder="5.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Order for Delivery ($)</Label>
                      <Input type="number" step="0.01" value={delivery.form.minOrderForDelivery ?? ''} onChange={e => delivery.set('minOrderForDelivery', e.target.value)} placeholder="20.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Delivery Distance (miles)</Label>
                      <Input type="number" value={delivery.form.maxDeliveryDistance ?? ''} onChange={e => delivery.set('maxDeliveryDistance', Number(e.target.value))} placeholder="10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Delivery Time (minutes)</Label>
                      <Input type="number" value={delivery.form.deliveryTimeEstimate ?? ''} onChange={e => delivery.set('deliveryTimeEstimate', Number(e.target.value))} placeholder="30" />
                    </div>
                  </div>
                  <Button onClick={() => saveDelivery.mutate(cleanPayload(delivery.form))} disabled={saveDelivery.isPending}>
                    <Save className="w-4 h-4 mr-2" />{saveDelivery.isPending ? 'Saving…' : 'Save Delivery Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Receipt Settings ──────────────────────────────────────────── */}
        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Configuration</CardTitle>
              <CardDescription>Customize receipt printing and layout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingReceipt ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="space-y-4">
                    {[
                      ['printLogo', 'Print Logo'],
                      ['showItemDescription', 'Show Item Description'],
                      ['showItemPrice', 'Show Item Price'],
                      ['showTaxBreakdown', 'Show Tax Breakdown'],
                      ['showDiscounts', 'Show Discounts'],
                      ['showPaymentMethod', 'Show Payment Method'],
                      ['showServerName', 'Show Server Name'],
                      ['showTableNumber', 'Show Table Number'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label>{label}</Label>
                        <Switch checked={!!receipt.form[key as keyof typeof receipt.form]} onCheckedChange={v => receipt.set(key as keyof typeof receipt.form, v)} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Receipt Header</Label>
                      <Input value={receipt.form.receiptHeader ?? ''} onChange={e => receipt.set('receiptHeader', e.target.value)} placeholder="Welcome to Our Restaurant!" />
                    </div>
                    <div className="space-y-2">
                      <Label>Receipt Footer</Label>
                      <Input value={receipt.form.receiptFooter ?? ''} onChange={e => receipt.set('receiptFooter', e.target.value)} placeholder="Thank you for your visit!" />
                    </div>
                    <div className="space-y-2">
                      <Label>Receipt Width (mm)</Label>
                      <Input type="number" value={receipt.form.receiptWidth ?? 80} onChange={e => receipt.set('receiptWidth', Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <h3 className="text-lg font-medium">Layout & Customization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Template Design</Label>
                        <Select value={receipt.form.templateType ?? 'classic'} onValueChange={v => receipt.set('templateType', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic (Thermal)</SelectItem>
                            <SelectItem value="modern">Modern (Compact)</SelectItem>
                            <SelectItem value="minimalist">Minimalist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Custom CSS</Label>
                        <textarea 
                          className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background text-sm font-mono"
                          value={receipt.form.customCss ?? ''} 
                          onChange={e => receipt.set('customCss', e.target.value)}
                          placeholder=".receipt-container { ... }"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => saveReceipt.mutate(cleanPayload(receipt.form))} disabled={saveReceipt.isPending}>
                    <Save className="w-4 h-4 mr-2" />{saveReceipt.isPending ? 'Saving…' : 'Save Receipt Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Settings ─────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Access control and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSecurity ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div><Label>Two-Factor Authentication</Label><p className="text-xs text-muted-foreground">Require 2FA for all users</p></div>
                      <Switch checked={!!security.form.twoFactorAuthEnabled} onCheckedChange={v => security.set('twoFactorAuthEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>Single Sign-On (SSO)</Label><p className="text-xs text-muted-foreground">Enable SSO for staff login</p></div>
                      <Switch checked={!!security.form.ssoEnabled} onCheckedChange={v => security.set('ssoEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div><Label>IP Whitelist</Label><p className="text-xs text-muted-foreground">Restrict access by IP address</p></div>
                      <Switch checked={!!security.form.ipWhitelistEnabled} onCheckedChange={v => security.set('ipWhitelistEnabled', v)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Session Timeout (seconds)</Label>
                      <Input type="number" value={security.form.sessionTimeout ?? 3600} onChange={e => security.set('sessionTimeout', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Password Length</Label>
                      <Input type="number" value={security.form.passwordMinLength ?? 8} onChange={e => security.set('passwordMinLength', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password Expiry (days, 0 = never)</Label>
                      <Input type="number" value={security.form.passwordExpiryDays ?? 0} onChange={e => security.set('passwordExpiryDays', Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      ['passwordRequireUppercase', 'Require Uppercase Letters'],
                      ['passwordRequireNumbers', 'Require Numbers'],
                      ['passwordRequireSpecialChars', 'Require Special Characters'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch checked={!!security.form[key as keyof typeof security.form]} onCheckedChange={v => security.set(key as keyof typeof security.form, v)} />
                        <Label>{label}</Label>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => saveSecurity.mutate(cleanPayload(security.form))} disabled={saveSecurity.isPending}>
                    <Save className="w-4 h-4 mr-2" />{saveSecurity.isPending ? 'Saving…' : 'Save Security Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── API Keys ──────────────────────────────────────────────────── */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys Management</CardTitle>
              <CardDescription>Create and manage API keys for integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingApiKeys ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key name (e.g. My App, Zapier)"
                      value={newApiKeyName}
                      onChange={e => setNewApiKeyName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateApiKey()}
                    />
                    <Button onClick={handleCreateApiKey} disabled={createApiKey.isPending}>
                      <Plus className="w-4 h-4 mr-2" />{createApiKey.isPending ? 'Creating…' : 'Create Key'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(!apiKeysData || apiKeysData.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">No API keys yet. Create one above.</p>
                    )}
                    {apiKeysData?.map((key: any) => (
                      <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{key.name}</p>
                          <p className="font-mono text-xs text-muted-foreground break-all">{key.keyHash}</p>
                          <p className="text-xs text-muted-foreground">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={key.isActive ? 'default' : 'secondary'}>{key.isActive ? 'Active' : 'Revoked'}</Badge>
                          {key.isActive && (
                            <Button variant="destructive" size="sm" onClick={() => revokeApiKey.mutate({ keyId: key.id })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Log Settings ────────────────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logging</CardTitle>
              <CardDescription>Configure audit logging for compliance and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAudit ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="space-y-4">
                    {[
                      ['enableAuditLogging', 'Enable Audit Logging'],
                      ['logUserActions', 'Log User Actions'],
                      ['logDataChanges', 'Log Data Changes'],
                      ['logLoginAttempts', 'Log Login Attempts'],
                      ['logPayments', 'Log Payment Events'],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label>{label}</Label>
                        <Switch checked={!!audit.form[key as keyof typeof audit.form]} onCheckedChange={v => audit.set(key as keyof typeof audit.form, v)} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Log Retention (days)</Label>
                    <Input type="number" value={audit.form.retentionDays ?? 90} onChange={e => audit.set('retentionDays', Number(e.target.value))} />
                  </div>
                  <Button onClick={() => saveAudit.mutate(cleanPayload(audit.form))} disabled={saveAudit.isPending}>
                    <Save className="w-4 h-4 mr-2" />{saveAudit.isPending ? 'Saving…' : 'Save Audit Settings'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Backup Settings ───────────────────────────────────────────── */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>Configure automatic backups and data export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingBackup ? <div className="text-muted-foreground text-sm">Loading…</div> : (
                <>
                  <div className="flex items-center justify-between">
                    <div><Label>Automatic Backups</Label><p className="text-xs text-muted-foreground">Schedule regular backups</p></div>
                    <Switch checked={!!backup.form.autoBackupEnabled} onCheckedChange={v => backup.set('autoBackupEnabled', v)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Backup Frequency</Label>
                      <Select value={backup.form.backupFrequency ?? 'daily'} onValueChange={v => backup.set('backupFrequency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Backup Time</Label>
                      <Input type="time" value={backup.form.backupTime ?? '02:00'} onChange={e => backup.set('backupTime', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Retention Period (days)</Label>
                      <Input type="number" value={backup.form.retentionDays ?? 30} onChange={e => backup.set('retentionDays', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>S3 Bucket Name</Label>
                      <Input value={backup.form.s3BucketName ?? ''} onChange={e => backup.set('s3BucketName', e.target.value)} placeholder="my-restaurant-backups" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={!!backup.form.s3Enabled} onCheckedChange={v => backup.set('s3Enabled', v)} />
                    <Label>Enable S3 Backups</Label>
                  </div>
                  {backupData?.lastBackupAt && (
                    <p className="text-xs text-muted-foreground">Last backup: {new Date(backupData.lastBackupAt).toLocaleString()}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => saveBackup.mutate(cleanPayload(backup.form))} disabled={saveBackup.isPending}>
                      <Save className="w-4 h-4 mr-2" />{saveBackup.isPending ? 'Saving…' : 'Save Backup Settings'}
                    </Button>
                    <Button variant="outline" onClick={() => triggerBackup.mutate()} disabled={triggerBackup.isPending}>
                      <RefreshCw className="w-4 h-4 mr-2" />{triggerBackup.isPending ? 'Running…' : 'Backup Now'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
