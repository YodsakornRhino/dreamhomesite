import { UserProfilePage } from "@/components/user-profile-page";

interface UserProfileRouteProps {
  params: { uid: string };
}

export default function UserProfileRoute({ params }: UserProfileRouteProps) {
  return <UserProfilePage uid={params.uid} />;
}
