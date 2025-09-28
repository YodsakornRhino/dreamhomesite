import { UserProfilePage } from "@/components/user-profile-page";

interface UserProfileRouteProps {
  params: Promise<{ uid: string }>;
}

export default async function UserProfileRoute({
  params,
}: UserProfileRouteProps) {
  const { uid } = await params;

  return <UserProfilePage uid={uid} />;
}
