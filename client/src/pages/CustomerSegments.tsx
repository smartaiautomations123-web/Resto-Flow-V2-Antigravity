import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Plus, Trash2, Users, Mail, MessageSquare, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CustomerSegments() {
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [segmentColor, setSegmentColor] = useState("#3b82f6");
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<"email" | "sms" | "push">("email");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const { data: segments, refetch: refetchSegments } = trpc.segments.list.useQuery();
  const { data: campaigns, refetch: refetchCampaigns } = trpc.campaigns.list.useQuery();
  const { data: segmentMembers } = trpc.segments.members.useQuery(
    { segmentId: selectedSegmentId || 0 },
    { enabled: !!selectedSegmentId }
  );
  const { data: campaignRecipients } = trpc.campaigns.recipients.useQuery(
    { campaignId: selectedCampaignId || 0 },
    { enabled: !!selectedCampaignId }
  );
  const { data: campaignStats } = trpc.campaigns.stats.useQuery(
    { campaignId: selectedCampaignId || 0 },
    { enabled: !!selectedCampaignId }
  );

  const createSegmentMutation = trpc.segments.create.useMutation({
    onSuccess: () => {
      toast.success("Segment created successfully");
      setSegmentName("");
      setSegmentDescription("");
      setSegmentColor("#3b82f6");
      refetchSegments();
    },
  });

  const deleteSegmentMutation = trpc.segments.delete.useMutation({
    onSuccess: () => {
      toast.success("Segment deleted");
      refetchSegments();
    },
  });

  const createCampaignMutation = trpc.campaigns.create.useMutation({
    onSuccess: (result) => {
      toast.success("Campaign created");
      setCampaignName("");
      setCampaignContent("");
      setCampaignSubject("");
      setCampaignType("email");
      setSelectedSegmentId(null);
      refetchCampaigns();

      // Add recipients if segment selected
      if (selectedSegmentId && segmentMembers) {
        const campaignId = (result as any).insertId;
        const customerIds = segmentMembers.map((m) => m.id).filter((id): id is number => id !== null);
        addRecipientsMutation.mutate({ campaignId, customerIds });
      }
    },
  });

  const addRecipientsMutation = trpc.campaigns.addRecipients.useMutation({
    onSuccess: () => {
      toast.success("Recipients added to campaign");
      refetchCampaigns();
    },
  });

  const deleteCampaignMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => {
      toast.success("Campaign deleted");
      refetchCampaigns();
    },
  });

  const handleExportSegment = async (segmentId: number) => {
    try {
      const exportData = await (trpc.segments.export as any).query({ segmentId });
      const csv = [
        ["Name", "Email", "Phone", "Total Spent", "Visit Count", "Loyalty Points"],
        ...exportData.map((c: any) => [c.name, c.email || "", c.phone || "", c.totalSpent, c.visitCount, c.loyaltyPoints]),
      ]
        .map((row: any) => row.map((cell: any) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `segment-${segmentId}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Segment exported as CSV");
    } catch (error) {
      toast.error("Failed to export segment");
    }
  };

  const handleCreateSegment = () => {
    if (!segmentName.trim()) {
      toast.error("Segment name is required");
      return;
    }
    createSegmentMutation.mutate({ name: segmentName, description: segmentDescription, color: segmentColor });
  };

  const handleCreateCampaign = () => {
    if (!campaignName.trim() || !campaignContent.trim()) {
      toast.error("Campaign name and content are required");
      return;
    }
    createCampaignMutation.mutate({
      name: campaignName,
      type: campaignType,
      content: campaignContent,
      subject: campaignSubject,
      segmentId: selectedSegmentId || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Segmentation & Communication</h1>
        <p className="text-muted-foreground mt-1">Manage customer segments and run targeted campaigns.</p>
      </div>

      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Segment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Segment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Segment Name</label>
                    <Input
                      placeholder="e.g., VIP Customers"
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="Optional description"
                      value={segmentDescription}
                      onChange={(e) => setSegmentDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={segmentColor}
                        onChange={(e) => setSegmentColor(e.target.value)}
                        className="w-12 h-10 rounded border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground pt-2">{segmentColor}</span>
                    </div>
                  </div>
                  <Button onClick={handleCreateSegment} className="w-full">
                    Create Segment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {segments?.map((segment) => (
              <Card key={segment.id} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: segment.color || "#3b82f6" }}
                    />
                    <div>
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      {segment.description && (
                        <p className="text-sm text-muted-foreground">{segment.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSegmentMutation.mutate({ id: segment.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSegmentId(segment.id)}
                          className="gap-2"
                        >
                          <Users className="h-4 w-4" />
                          View Members
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{segment.name} - Members</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="border-b border-border">
                                <tr>
                                  <th className="text-left py-2 px-4 font-semibold">Name</th>
                                  <th className="text-left py-2 px-4 font-semibold">Email</th>
                                  <th className="text-left py-2 px-4 font-semibold">Phone</th>
                                  <th className="text-right py-2 px-4 font-semibold">Visits</th>
                                  <th className="text-right py-2 px-4 font-semibold">Spent</th>
                                </tr>
                              </thead>
                              <tbody>
                                {segmentMembers?.map((member) => (
                                  <tr key={member.id} className="border-b border-border/50 hover:bg-accent/30">
                                    <td className="py-2 px-4">{member.name}</td>
                                    <td className="py-2 px-4 text-muted-foreground">{member.email || "-"}</td>
                                    <td className="py-2 px-4 text-muted-foreground">{member.phone || "-"}</td>
                                    <td className="text-right py-2 px-4">{member.visitCount}</td>
                                    <td className="text-right py-2 px-4 font-semibold">${Number(member.totalSpent).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleExportSegment(segment.id)}
                          >
                            <Download className="h-4 w-4" />
                            Export as CSV
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input
                      placeholder="e.g., Spring Promotion"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Campaign Type</label>
                    <select
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value as "email" | "sms" | "push")}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push Notification</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Segment</label>
                    <select
                      value={selectedSegmentId || ""}
                      onChange={(e) => setSelectedSegmentId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="">Select a segment (optional)</option>
                      {segments?.map((seg) => (
                        <option key={seg.id} value={seg.id}>
                          {seg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {campaignType === "email" && (
                    <div>
                      <label className="text-sm font-medium">Email Subject</label>
                      <Input
                        placeholder="Email subject line"
                        value={campaignSubject}
                        onChange={(e) => setCampaignSubject(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Content</label>
                    <textarea
                      placeholder="Campaign message content"
                      value={campaignContent}
                      onChange={(e) => setCampaignContent(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background h-32 resize-none"
                    />
                  </div>
                  <Button onClick={handleCreateCampaign} className="w-full">
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {campaigns?.map((campaign) => (
              <Card key={campaign.id} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{campaign.type}</Badge>
                      <Badge variant={campaign.status === "sent" ? "default" : "secondary"}>{campaign.status}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCampaignMutation.mutate({ id: campaign.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Recipients</p>
                      <p className="text-2xl font-bold">{campaign.totalRecipients}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="text-2xl font-bold">{campaign.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Opened</p>
                      <p className="text-2xl font-bold text-success">{campaign.openCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Clicked</p>
                      <p className="text-2xl font-bold text-info">{campaign.clickCount}</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedCampaignId(campaign.id)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{campaign.name} - Recipients</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-border">
                              <tr>
                                <th className="text-left py-2 px-4 font-semibold">Customer</th>
                                <th className="text-left py-2 px-4 font-semibold">Email</th>
                                <th className="text-left py-2 px-4 font-semibold">Status</th>
                                <th className="text-left py-2 px-4 font-semibold">Sent</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaignRecipients?.map((recipient) => (
                                <tr key={recipient.id} className="border-b border-border/50">
                                  <td className="py-2 px-4">{recipient.customerName}</td>
                                  <td className="py-2 px-4 text-muted-foreground">{recipient.customerEmail || "-"}</td>
                                  <td className="py-2 px-4">
                                    <Badge variant="outline">{recipient.status}</Badge>
                                  </td>
                                  <td className="py-2 px-4 text-muted-foreground">
                                    {recipient.sentAt ? new Date(recipient.sentAt).toLocaleDateString() : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
