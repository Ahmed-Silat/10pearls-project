import { useEffect, useState } from "react";
import Button from "../button/Button";
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
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 py-32 text-sky-600"
      >
        <Spinner className="h-8 w-8" />
        <p className="text-sm font-medium text-slate-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {loadFailed && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200">
          Couldn&apos;t load the latest profile details. Showing the last saved copy.
        </p>
      )}
      <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200/70">
        {/* Banner */}
        <div className="relative h-36 bg-gradient-to-r from-sky-600 via-sky-700 to-cyan-800">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        {/* Identity header */}
        <div className="px-6 pb-2 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              <span className="relative -mt-14 flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-600 text-4xl font-extrabold text-white shadow-xl ring-4 ring-white">
                {initials}
              </span>
              <div className="sm:pb-1">
                <h1 className="text-2xl font-bold capitalize tracking-tight text-slate-900 sm:text-3xl">
                  {currentUser.firstName} {currentUser.lastName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                    <UserIcon className="h-3 w-3" />
                    Account Holder
                  </span>
                  {memberSince && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Member since {memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2 sm:pb-1">
              <Button
                name="Change Password"
                image={<LockIcon className="h-4 w-4" />}
                onClick={openChangePasswordModal}
                className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              />
              <Button
                name="Edit Profile"
                image={<PencilIcon className="h-4 w-4" />}
                onClick={openEditProfileModal}
                className="bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 px-6 pb-8 sm:px-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Personal Details
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detailFields.map(({ label, value, Icon, capitalize }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-colors duration-200 hover:border-sky-200 hover:bg-sky-50/60"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-sm font-semibold text-slate-800 ${
                      capitalize ? "capitalize" : ""
                    }`}
                  >
                    {value || <EmptyValue />}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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