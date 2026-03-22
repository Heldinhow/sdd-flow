import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export interface Task {
  id: string;
  description: string;
  phase: string;
  userStory?: string;
  parallel: boolean;
  completed: boolean;
  filePaths: string[];
}

export interface LoadTasksResult {
  featureDir: string;
  tasks: Task[];
  phases: string[];
  totalTasks: number;
  completedTasks: number;
  hasErrors: boolean;
  errorMessage?: string;
}

function extractFilePaths(text: string): string[] {
  const filePathPattern = /\b(?:src|tests?|lib|bin|cmd|server|client|api|backend|frontend|web|mobile|ios|android|docs?|scripts?|config|assets|public|dist|build|out)\/[^\s)\]"',]+/gi;
  const matches = text.match(filePathPattern);
  return matches ? [...new Set(matches)] : [];
}

function loadTasks(tasksPath: string, featureDir: string): LoadTasksResult {
  if (!existsSync(tasksPath)) {
    return {
      featureDir,
      tasks: [],
      phases: [],
      totalTasks: 0,
      completedTasks: 0,
      hasErrors: true,
      errorMessage: `Tasks file not found: ${tasksPath}`,
    };
  }

  const content = readFileSync(tasksPath, "utf-8");
  const lines = content.split("\n");

  const tasks: Task[] = [];
  let currentPhase = "Unknown";
  const phases: string[] = [];

  const phasePattern = /^##\s+Phase\s+\d+[^:]*:\s*(.+)$/;
  const taskPattern = /^-\s+\[([ xX])\]\s+([A-Z]+\d+)\s+(.+)$/;

  for (const line of lines) {
    const phaseMatch = line.match(phasePattern);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].trim();
      if (!phases.includes(currentPhase)) {
        phases.push(currentPhase);
      }
      continue;
    }

    const taskMatch = line.match(taskPattern);
    if (taskMatch) {
      const completedChar = taskMatch[1];
      const taskId = taskMatch[2];
      const taskDescription = taskMatch[3].trim();

      const parallel = taskDescription.includes("[P]");
      const userStoryMatch = taskDescription.match(/\[(US\d+)\]/);
      const userStory = userStoryMatch ? userStoryMatch[1] : undefined;

      const filePaths = extractFilePaths(taskDescription);

      tasks.push({
        id: taskId,
        description: taskDescription,
        phase: currentPhase,
        userStory,
        parallel,
        completed: completedChar.toLowerCase() === "x",
        filePaths,
      });
    }
  }

  const completedTasks = tasks.filter((t) => t.completed).length;

  return {
    featureDir,
    tasks,
    phases,
    totalTasks: tasks.length,
    completedTasks,
    hasErrors: false,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const tasksPath = args[0];
  const featureDir = args[1] || path.dirname(tasksPath);

  if (!tasksPath) {
    console.error(JSON.stringify({ error: "Usage: load-tasks.ts <tasks-path> [feature-dir]" }));
    process.exit(1);
  }

  const result = loadTasks(tasksPath, featureDir);
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { loadTasks };
