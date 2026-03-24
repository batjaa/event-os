import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SponsorsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Sponsors
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage sponsor pipeline for Dev Summit 2026
          </p>
        </div>
        <Button size="sm">+ Add Sponsor</Button>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-1">No sponsors yet</h3>
          <p className="text-sm text-muted-foreground">
            Add your first sponsor to start tracking the pipeline.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
