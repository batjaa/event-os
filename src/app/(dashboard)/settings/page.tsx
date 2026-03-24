import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your event and organization
        </p>
      </div>

      <div className="space-y-6 max-w-lg">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-medium">Event Details</h2>
            <div className="space-y-1.5">
              <Label>Event Name</Label>
              <Input defaultValue="Dev Summit 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <Input defaultValue="Chinggis Khaan Hotel, Ulaanbaatar" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" defaultValue="2026-03-28" />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" defaultValue="2026-03-29" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-medium">Telegram Integration</h2>
            <p className="text-sm text-muted-foreground">
              Connect your Telegram group to receive agent notifications for
              speaker applications, deadline reminders, and conflict alerts.
            </p>
            <div className="space-y-1.5">
              <Label>Telegram Bot Token</Label>
              <Input type="password" placeholder="Enter your bot token..." />
            </div>
            <div className="space-y-1.5">
              <Label>Chat ID</Label>
              <Input placeholder="e.g., -1001234567890" />
            </div>
            <Button variant="outline">Connect Telegram</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
