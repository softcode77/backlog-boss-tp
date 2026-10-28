import { requireUser } from "@/lib/dal";
import { getLibrary } from "@/lib/queries";
import { LibraryView } from "@/components/library-view";
import { requestNow } from "@/lib/time";

// A Server Component: runs on the server, reads the DB directly, and hands plain data to the
// interactive (client) LibraryView.
export default async function LibraryPage() {
  const user = await requireUser();
  const library = await getLibrary(user.id);
  return <LibraryView library={library} now={requestNow()} />;
}
