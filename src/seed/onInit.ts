import type { Payload } from "payload";
import { ensureAdmin } from "./ensureAdmin";
import { seedRealisations } from "./seedRealisations";

export async function onInit(payload: Payload): Promise<void> {
  await ensureAdmin(payload);
  await seedRealisations(payload);
}
