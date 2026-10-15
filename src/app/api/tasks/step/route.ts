export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { executeSubtask, type Subtask } from "@/lib/fusion-engine";

// POST /api/tasks/step — process ONE pending subtask for the given task
// The frontend calls this repeatedly until all subtasks are done.
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

    const task = await db.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Parse the plan
    const plan: Subtask[] = JSON.parse(task.planJson || "[]");
    
    // Find the next pending subtask whose dependencies are met
    let nextSubtask: Subtask | null = null;
    for (const s of plan) {
      if (s.status === "PENDING") {
        // Check dependencies
        const depsOk = !s.dependsOn || s.dependsOn.every(depIdx => {
          const dep = plan.find(p => p.idx === depIdx);
          return dep?.status === "COMPLETED";
        });
        if (depsOk) {
          nextSubtask = s;
          break;
        }
      }
    }

    if (!nextSubtask) {
      // No more pending subtasks — check if all are done
      const allDone = plan.every(s => s.status === "COMPLETED" || s.status === "SKIPPED");
      if (allDone && task.status !== "COMPLETED" && task.status !== "FAILED") {
        // Run verification
        await db.task.update({
          where: { id: taskId },
          data: { status: "VERIFYING" },
        });
        
        // Build verification result
        const artifacts = JSON.parse(task.artifactsJson || "[]");
        const plan = JSON.parse(task.planJson || "[]");
        const completedCount = plan.filter((s: any) => s.status === "COMPLETED").length;
        const passed = completedCount > 0;
        
        const verification = {
          passed,
          summary: passed 
            ? `Task completed successfully. ${completedCount} subtasks executed, ${artifacts.length} artifacts produced.`
            : "Task failed — no subtasks completed.",
          checks: [
            { name: "Subtasks completed", passed: completedCount > 0, details: `${completedCount}/${plan.length}` },
            { name: "Artifacts produced", passed: artifacts.length > 0, details: `${artifacts.length} files` },
          ],
        };
        
        await db.task.update({
          where: { id: taskId },
          data: {
            status: passed ? "COMPLETED" : "FAILED",
            completedAt: new Date(),
            verificationJson: JSON.stringify(verification),
          },
        });
        
        return NextResponse.json({
          message: "Task completed",
          taskId,
          status: passed ? "COMPLETED" : "FAILED",
          allDone: true,
        });
      }
      return NextResponse.json({
        message: "No pending subtasks",
        taskId,
        status: task.status,
        allDone: true,
      });
    }

    // Mark as RUNNING
    if (task.status === "QUEUED" || task.status === "PAUSED" || task.status === "FAILED") {
      await db.task.update({
        where: { id: taskId },
        data: { status: "RUNNING", startedAt: new Date() },
      });
    }

    // Execute this ONE subtask
    const updatedSubtask: Subtask = {
      ...nextSubtask,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
    };

    try {
      const result = await executeSubtask(updatedSubtask, task.description, taskId);
      
      updatedSubtask.status = "COMPLETED";
      updatedSubtask.result = result.result;
      updatedSubtask.tokensUsed = result.tokensUsed;
      updatedSubtask.completedAt = new Date().toISOString();

      // Update plan in DB
      const updatedPlan = plan.map(s => s.idx === updatedSubtask.idx ? updatedSubtask : s);
      
      // Get existing events and artifacts
      const existingEvents = JSON.parse(task.eventsJson || "[]");
      const existingArtifacts = JSON.parse(task.artifactsJson || "[]");
      
      // Add new events and artifacts
      const allEvents = [...existingEvents, ...result.events];
      const allArtifacts = [...existingArtifacts, ...result.artifacts];
      
      // Calculate total tokens
      let totalTokens = task.usedTokens || 0;
      totalTokens += result.tokensUsed;
      
      await db.task.update({
        where: { id: taskId },
        data: {
          planJson: JSON.stringify(updatedPlan),
          eventsJson: JSON.stringify(allEvents.slice(-30)),
          artifactsJson: JSON.stringify(allArtifacts),
          usedTokens: totalTokens,
          estimatedCost: totalTokens * 0.00001,
          status: "RUNNING",
        },
      });

      return NextResponse.json({
        message: `Subtask ${updatedSubtask.idx + 1} completed`,
        taskId,
        subtask: updatedSubtask.title,
        status: "RUNNING",
        tokensUsed: result.tokensUsed,
        allDone: false,
      });
    } catch (err) {
      // Mark subtask as failed
      updatedSubtask.status = "FAILED";
      updatedSubtask.error = err instanceof Error ? err.message : "Unknown error";
      const updatedPlan = plan.map(s => s.idx === updatedSubtask.idx ? updatedSubtask : s);
      
      await db.task.update({
        where: { id: taskId },
        data: {
          planJson: JSON.stringify(updatedPlan),
          status: "FAILED",
          errorMessage: updatedSubtask.error,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Subtask failed",
        taskId,
        error: updatedSubtask.error,
        status: "FAILED",
        allDone: true,
      }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
