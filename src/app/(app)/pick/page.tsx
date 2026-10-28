import { getPicks } from "@/app/actions/picker";
import { DEFAULT_CONTEXT } from "@/lib/engine/picker";
import { PickerView } from "@/components/picker-view";

export default async function PickPage() {
  // Server Actions are plain async functions, so the server can call one directly to
  // render the first result — no loading spinner on first visit.
  const initial = await getPicks(DEFAULT_CONTEXT);
  return <PickerView initial={initial} />;
}
