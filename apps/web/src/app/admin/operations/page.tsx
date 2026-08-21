import { redirect } from "next/navigation";

/**
 * Operasyon workspace retired — keep URL stable for bookmarks/nav.
 */
export default function AdminOperationsRedirect() {
  redirect("/admin");
}
