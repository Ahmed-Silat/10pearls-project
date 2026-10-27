import { Star } from "lucide-react";

/**
 * Every icon the app uses, from lucide (the icon set shadcn/ui is built with). Components import icons from
 * here by role (PhoneIcon, TrashIcon, ...), so the icon set can change in one place.
 */
export {
  Search as SearchIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  ArrowLeft as ArrowLeftIcon,
  User as UserIcon,
  Users as UsersIcon,
  BookUser as LogoIcon,
  Plus as PlusIcon,
  SquarePen as PencilIcon,
  Trash2 as TrashIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as PinIcon,
  Lock as LockIcon,
  LogOut as LogoutIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ArrowDownAZ as SortAZIcon,
  ArrowDownZA as SortZAIcon,
  House as HomeIcon,
  SearchX as LostIcon,
  Star as StarOutlineIcon,
  Siren as EmergencyIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Monitor as MonitorIcon,
  Check as CheckIcon,
  Tag as TagIcon,
  Tags as TagsIcon,
  Ellipsis as EllipsisIcon,
  ListChecks as SelectIcon,
  CircleMinus as RemoveTagIcon,
  Building2 as CompanyIcon,
  Cake as BirthdayIcon,
  StickyNote as NotesIcon,
  ArrowDownUp as ImportExportIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FileSpreadsheet as SpreadsheetIcon,
  Contact as VCardIcon,
  FileUp as FileUploadIcon,
  CircleCheck as SuccessIcon,
  CircleAlert as ErrorIcon,
  TriangleAlert as WarningIcon,
} from "lucide-react";

/** A filled star, for starred (favourite) contacts. */
export const StarIcon = (props) => <Star fill="currentColor" {...props} />;
