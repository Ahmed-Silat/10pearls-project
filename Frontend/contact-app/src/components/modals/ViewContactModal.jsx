import Modal from "../ui/Modal";
import Button from "../button/Button";
import EmptyValue from "../ui/EmptyValue";
import { MailIcon, PencilIcon, PhoneIcon, PinIcon } from "../icons/Icons";

/** Read-only view of a contact, so long names and details can be seen in full. */
export default function ViewContactModal({ contact, onClose, onEdit }) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = `${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`.toUpperCase();

  const details = [
    {
      label: "Phone",
      Icon: PhoneIcon,
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null,
    },
    {
      label: "Email",
      Icon: MailIcon,
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : null,
    },
    { label: "Address", Icon: PinIcon, value: contact.address, href: null },
  ];

  return (
    <Modal onClose={onClose} titleId="view-contact-title" panelClassName="sm:max-w-md">
      <div className="px-6 pt-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-xl font-bold text-white shadow-lg shadow-sky-600/30">
            {initials}
          </span>
          <h3
            id="view-contact-title"
            className="mt-3 break-words text-xl font-bold capitalize text-slate-900 [overflow-wrap:anywhere]"
          >
            {fullName}
          </h3>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">
            Contact details
          </p>
        </div>

        <dl className="mt-5 divide-y divide-slate-100 rounded-xl bg-slate-50 ring-1 ring-slate-200">
          {details.map(({ label, Icon, value, href }) => (
            <div key={label} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-sky-600 shadow-sm ring-1 ring-slate-200">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                  {!value ? (
                    <EmptyValue />
                  ) : href ? (
                    <a href={href} className="text-sky-700 hover:text-sky-800 hover:underline">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row-reverse">
        <Button
          name="Edit"
          image={<PencilIcon className="h-4 w-4" />}
          onClick={onEdit}
          className="w-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 sm:w-auto"
        />
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 sm:w-auto"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
