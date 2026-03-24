import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Upload } from "lucide-react";

export default function AttendeesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Attendees
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage registrations for Dev Summit 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-3 w-3" /> Import CSV
          </Button>
          <Button size="sm">+ Add Attendee</Button>
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">No attendees yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Import attendees from CSV or add them manually.
          </p>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
