"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import LabelWithInput from "../label-and-inputs/LabelWithInput";

export default function EditModal(props) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onClose={props.onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <PencilSquareIcon
                    aria-hidden="true"
                    className="h-6 w-6 text-blue-600"
                  />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold leading-6 text-gray-900"
                  >
                    Update Contact
                  </DialogTitle>
                  <div className="mt-2">
                    <form>
                      <div className="flex space-x-4">
                        <LabelWithInput
                          htmlFor="firstName"
                          labelName="First Name"
                          inputType="text"
                          inputId="firstName"
                          placeholder="Enter Your First Name"
                          //   onChange={handleFisrtNameChange}
                        />

                        <LabelWithInput
                          htmlFor="lastName"
                          labelName="Last Name"
                          inputType="text"
                          inputId="lastName"
                          placeholder="Enter Your Last Name"
                          //   onChange={handleLastNameChange}
                        />
                      </div>

                      <div className="flex space-x-4">
                        <LabelWithInput
                          htmlFor="email"
                          labelName="Email Address"
                          inputType="text"
                          inputId="email"
                          placeholder="Enter Your Email"
                          // onChange={handleEmailChange}
                        />

                        <LabelWithInput
                          htmlFor="phone"
                          labelName="Phone No"
                          inputType="text"
                          inputId="phone"
                          placeholder="Enter Your Phone No"
                          // onChange={handlePhoneNoChange}
                        />
                      </div>

                      <div className="">
                        <LabelWithInput
                          htmlFor="address"
                          labelName="Address"
                          inputType="text"
                          inputId="address"
                          placeholder="Enter Your Address"
                          // onChange={handleAddressChange}
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-200 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={props.onClose}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              >
                Update
              </button>
              <button
                type="button"
                data-autofocus
                onClick={props.onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
