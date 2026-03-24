"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus, Calendar, User } from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
type Priority = "low" | "medium" | "high" | "urgent";

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-stone-100 text-stone-600" },
  in_progress: { label: "In Progress", color: "bg-sky-50 text-sky-700" },
  done: { label: "Done", color: "bg-emerald-50 text-emerald-700" },
  blocked: { label: "Blocked", color: "bg-red-50 text-red-600" },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
  high: { label: "High", color: "bg-yellow-100 text-yellow-700" },
  medium: { label: "Medium", color: "bg-stone-100 text-stone-600" },
  low: { label: "Low", color: "bg-stone-50 text-stone-400" },
};

const mockTeams = [
  { id: "1", name: "Program", color: "#eab308" },
  { id: "2", name: "Logistics", color: "#0284c7" },
  { id: "3", name: "Sponsors & Partners", color: "#047857" },
  { id: "4", name: "Speakers", color: "#7c3aed" },
  { id: "5", name: "Marketing", color: "#ea580c" },
];

const mockTasks: Array<{
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  teamId: string;
  teamName: string;
  assigneeName: string;
  dueDate: string | null;
  linkedEntity: string | null;
}> = [
  { id: "1", title: "Finalize keynote speaker contract", status: "in_progress", priority: "urgent", teamId: "4", teamName: "Speakers", assigneeName: "Amarbayar", dueDate: "2026-03-01", linkedEntity: "Speaker: Batbold T." },
  { id: "2", title: "Send venue deposit to Chinggis Khaan Hotel", status: "todo", priority: "high", teamId: "2", teamName: "Logistics", assigneeName: "Tuvshin", dueDate: "2026-02-20", linkedEntity: "Venue: Chinggis Khaan Hotel" },
  { id: "3", title: "Design sponsor deck for Gold package", status: "done", priority: "high", teamId: "3", teamName: "Sponsors & Partners", assigneeName: "Sarnai", dueDate: "2026-02-15", linkedEntity: null },
  { id: "4", title: "Book AV equipment and test setup", status: "todo", priority: "medium", teamId: "2", teamName: "Logistics", assigneeName: "Tuvshin", dueDate: "2026-03-20", linkedEntity: "Venue: Chinggis Khaan Hotel" },
  { id: "5", title: "Publish speaker announcement series on social", status: "in_progress", priority: "medium", teamId: "5", teamName: "Marketing", assigneeName: "Sarnai", dueDate: "2026-03-05", linkedEntity: null },
  { id: "6", title: "Recruit 20 student volunteers from NUM", status: "todo", priority: "medium", teamId: "2", teamName: "Logistics", assigneeName: "Dolgorsuren", dueDate: "2026-03-10", linkedEntity: null },
  { id: "7", title: "Review and accept/reject remaining CFP applications", status: "blocked", priority: "high", teamId: "4", teamName: "Speakers", assigneeName: "Amarbayar", dueDate: "2026-02-28", linkedEntity: null },
  { id: "8", title: "Set up check-in stations and test QR scanning", status: "todo", priority: "high", teamId: "2", teamName: "Logistics", assigneeName: "Tuvshin", dueDate: "2026-03-25", linkedEntity: null },
  { id: "9", title: "Collect logos from all confirmed sponsors", status: "in_progress", priority: "low", teamId: "3", teamName: "Sponsors & Partners", assigneeName: "Sarnai", dueDate: "2026-03-10", linkedEntity: null },
  { id: "10", title: "Create event day run-of-show document", status: "todo", priority: "medium", teamId: "1", teamName: "Program", assigneeName: "Amarbayar", dueDate: "2026-03-20", linkedEntity: null },
];

export default function TasksPage() {
  const [teamFilter, setTeamFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [view, setView] = useState<"list" | "board">("list");

  const filtered = mockTasks
    .filter((t) => teamFilter === "all" || t.teamId === teamFilter)
    .filter((t) => statusFilter === "all" || t.status === statusFilter);

  const counts = {
    todo: mockTasks.filter((t) => t.status === "todo").length,
    in_progress: mockTasks.filter((t) => t.status === "in_progress").length,
    done: mockTasks.filter((t) => t.status === "done").length,
    blocked: mockTasks.filter((t) => t.status === "blocked").length,
  };

  return (
    <div>
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">Track what needs to get done across all teams</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs font-medium ${view === "list" ? "bg-stone-900 text-white" : "text-stone-500"} rounded-l-md`}
            >
              List
            </button>
            <button
              onClick={() => setView("board")}
              className={`px-3 py-1.5 text-xs font-medium ${view === "board" ? "bg-stone-900 text-white" : "text-stone-500"} rounded-r-md`}
            >
              Board
            </button>
          </div>
          <Button size="sm"><Plus className="mr-2 h-3 w-3" /> Add Task</Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
        {(Object.entries(counts) as [TaskStatus, number][]).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className={`text-2xl font-semibold tabular-nums ${status === "blocked" ? "text-red-600" : status === "done" ? "text-emerald-600" : status === "in_progress" ? "text-sky-600" : ""}`}>
                {count}
              </p>
              <p className="text-xs text-muted-foreground">{statusConfig[status].label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team filters */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Button variant={teamFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setTeamFilter("all")}>All Teams</Button>
        {mockTeams.map((team) => (
          <Button
            key={team.id}
            variant={teamFilter === team.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTeamFilter(team.id)}
          >
            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
            {team.name}
          </Button>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "todo", "in_progress", "blocked", "done"] as const).map((status) => (
          <Button key={status} variant={statusFilter === status ? "secondary" : "ghost"} size="sm" onClick={() => setStatusFilter(status)} className="capitalize text-xs">
            {status === "all" ? "All" : statusConfig[status as TaskStatus].label}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {view === "list" ? (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
            return (
              <Card key={task.id} className={`hover:border-yellow-500/30 transition-colors ${task.status === "blocked" ? "border-red-200" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                        <Badge className={statusConfig[task.status].color}>{statusConfig[task.status].label}</Badge>
                        <Badge className={priorityConfig[task.priority].color}>{priorityConfig[task.priority].label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mockTeams.find((t) => t.id === task.teamId)?.color }} />
                          {task.teamName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assigneeName}
                        </span>
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                            <Calendar className="h-3 w-3" />
                            {isOverdue ? "OVERDUE: " : ""}{new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {task.linkedEntity && (
                          <span className="text-yellow-600">{task.linkedEntity}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Board view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["todo", "in_progress", "blocked", "done"] as TaskStatus[]).map((status) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium">{statusConfig[status].label}</h3>
                <Badge variant="outline" className="text-[10px]">{filtered.filter((t) => t.status === status).length}</Badge>
              </div>
              <div className="space-y-2">
                {filtered.filter((t) => t.status === status).map((task) => (
                  <Card key={task.id} className="hover:border-yellow-500/30 transition-colors">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium mb-1">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className={priorityConfig[task.priority].color + " text-[10px]"}>{task.priority}</Badge>
                        <span className="text-[10px] text-muted-foreground">{task.assigneeName}</span>
                      </div>
                      {task.dueDate && (
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(task.dueDate).toLocaleDateString()}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
