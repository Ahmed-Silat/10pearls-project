import React, { useState } from "react";
import Button from "../button/Button";
import ChangePasswordModal from "../modals/ChangePasswordModal";

const UserProfile = () => {
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  const userDetails = localStorage.getItem("userData");
  const currentUser = JSON.parse(userDetails);

  const openChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const closeChangePasswordModal = () => setIsChangePasswordModalOpen(false);

  return (
    <div>
      <div class="px-4 sm:px-0">
        <h3 class="text-base/7 font-semibold text-gray-900">User Profile</h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">Personal details.</p>
      </div>
      <div class="mt-6 border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">First Name</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {currentUser.firstName}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Last Name</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {currentUser.lastName}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Email Address</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {currentUser.email}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Phone Number</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {currentUser.phone}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900">Address</dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {currentUser.address}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt class="text-sm/6 font-medium text-gray-900"></dt>
            <dd class="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
              <Button
                name="Change Password"
                onClick={openChangePasswordModal}
                className="bg-blue-600 ml-2 my-3 px-5 py-2 flex justify-center items-center transition 
                duration-500 ease-in-out hover:bg-blue-500 rounded-2xl font-semibold text-sm"
              />
            </dd>
          </div>
        </dl>
      </div>
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={closeChangePasswordModal}
          userId={currentUser.id}
        />
      )}
    </div>
  );
};

export default UserProfile;
