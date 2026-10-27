import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Spinner from "../ui/Spinner";
import { getUser } from "../../service/authService";
import ChangePasswordModal from "../modals/ChangePasswordModal";
import EditProfileModal from "../modals/EditProfileModal";
import EmptyValue from "../ui/EmptyValue";
import {
  LockIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PinIcon,
  UserIcon,
} from "../icons/Icons";

const UserProfile = () => {
  useDocumentTitle("Profile");
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem("userData"))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Load the latest profile from the server; fall back to the saved copy if that fails.
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const freshUser = await getUser(currentUser.id);
        if (cancelled) return;
        const stored = JSON.parse(localStorage.getItem("userData")) || {};
        const userData = { ...stored, ...freshUser };
        localStorage.setItem("userData", JSON.stringify(userData));
        window.dispatchEvent(new Event("userDataUpdated"));
        setCurrentUser(userData);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
    // Only on first load; later changes come from the Edit Profile modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const closeChangePasswordModal = () => setIsChangePasswordModalOpen(false);
  const openEditProfileModal = () => setIsEditProfileModalOpen(true);
  const closeEditProfileModal = () => setIsEditProfileModalOpen(false);

  const initials = `${currentUser.firstName?.[0] || ""}${
    currentUser.lastName?.[0] || ""
  }`.toUpperCase();

  const memberSince = (() => {
    const created = currentUser.createdAt || currentUser.dateCreated;
    if (!created) return null;
    const date = new Date(created);
    return isNaN(date.getTime())
      ? null
      : date.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });
  })();

  const detailFields = [
    { label: "First Name", value: currentUser.firstName, Icon: UserIcon, capitalize: true },
    { label: "Last Name", value: currentUser.lastName, Icon: UserIcon, capitalize: true },
    { label: "Email Address", value: currentUser.email, Icon: MailIcon },
    { label: "Phone Number", value: currentUser.phone, Icon: PhoneIcon },
    { label: "Address", value: currentUser.address, Icon: PinIcon },
  ];

  if (isLoading) {
    return (
      <div role="status" className="flex flex-col items-center justify-center gap-3 py-32 text-muted-foreground">
        <Spinner className="h-6 w-6" />
        <p className="text-sm">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 p-4 md:p-6">
      {loadFailed && (
        <Alert variant="warning">
          <AlertDescription>
            Couldn&apos;t load the latest profile details. Showing the last saved copy.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-xl sm:h-20 sm:w-20">
            <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold capitalize tracking-tight">
              {currentUser.firstName} {currentUser.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Account Holder</Badge>
              {memberSince && <Badge variant="outline">Member since {memberSince}</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={openChangePasswordModal}>
            <LockIcon />
            Change Password
          </Button>
          <Button onClick={openEditProfileModal}>
            <PencilIcon />
            Edit Profile
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>The details saved on your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {detailFields.map(({ label, value, Icon, capitalize }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className={cn("truncate text-sm font-medium", capitalize && "capitalize")}>
                    {value || <EmptyValue />}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={closeChangePasswordModal}
          userId={currentUser.id}
        />
      )}

      {isEditProfileModalOpen && (
        <EditProfileModal
          user={currentUser}
          onClose={closeEditProfileModal}
          onSaved={setCurrentUser}
        />
      )}
    </div>
  );
};

export default UserProfile;
