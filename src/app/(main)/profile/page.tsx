import { redirect } from "next/navigation";
import { auth } from "@/../auth";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to the user's profile page using their username
  const username = session.user.username;
  if (username) {
    redirect(`/${username}`);
  }

  // Fallback to settings if no username is set
  redirect("/settings/profile");
}
