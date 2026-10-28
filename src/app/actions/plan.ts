"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { requireUser } from "@/lib/dal";

const Plan = z.object({
  weeklyMinutes: z.array(z.number().int().min(0).max(24 * 60)).length(7),
  deadline: z.iso.date(),
  queue: z.array(z.string()).max(20),
});

export async function savePlan(input: z.infer<typeof Plan>) {
  const user = await requireUser();
  const plan = Plan.parse(input);
  const values = {
    weeklyMinutes: JSON.stringify(plan.weeklyMinutes),
    deadline: plan.deadline,
    queue: JSON.stringify(plan.queue),
  };
  await db
    .insert(plans)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: plans.userId, set: values });
  revalidatePath("/plan");
  revalidatePath("/stats");
}
