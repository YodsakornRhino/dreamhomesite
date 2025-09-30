import { UserProfilePage } from "@/components/user-profile-page";

interface UserProfileRouteProps {
  params: { uid: string };
  searchParams?: { propertyId?: string };
}

export default function UserProfileRoute({
  params,
  searchParams,
}: UserProfileRouteProps) {
  return (
    <UserProfilePage
      uid={params.uid}
      initialPropertyId={searchParams?.propertyId}
    />
  );
}
