import React from 'react';
import {
  Car,
  CheckCircle,
  XCircle,
  Check,
  X,
  AlertTriangle,
  Siren,
  Bell,
  MapPin,
  Calendar,
  Clock,
  Phone,
  RefreshCw,
  Volume2,
  VolumeX,
  User,
  Users,
  KeyRound,
  Lock,
  Plus,
  Trash2,
  LogOut,
  LayoutDashboard,
  Zap,
  Flag,
  MessageSquare,
  Sliders,
  Search,
  ArrowRight,
  ExternalLink,
  Shield,
  FileText,
  Building,
  Navigation,
  Send,
  Info,
  Eye,
  EyeOff,
  Edit3,
  Copy
} from 'lucide-react';

/**
 * Fleetza Theme Matching Icons
 * All icons follow Fleetza's corporate brand theme with configurable size and color.
 */

export const TaxiIcon = ({ size = 20, className = '', color = 'currentColor', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`fleetza-icon ${className}`}
    {...props}
  >
    <path d="M14 2h-4v2h4V2z" />
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10l-2-4H10L8 10s-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export const WhatsAppIcon = ({ size = 18, className = '', color = 'currentColor', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`fleetza-icon whatsapp-icon ${className}`}
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M9.5 9a.5.5 0 0 0-.5.5v.5c0 2 1.5 3.5 3.5 3.5h.5a.5.5 0 0 0 .5-.5V12a.5.5 0 0 0-.5-.5h-.5l-.8-.8v-.7h.8a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5h-2z" />
  </svg>
);

export const CarIcon = (props) => <Car size={props.size || 18} {...props} />;
export const CheckCircleIcon = (props) => <CheckCircle size={props.size || 18} {...props} />;
export const XCircleIcon = (props) => <XCircle size={props.size || 18} {...props} />;
export const CheckIcon = (props) => <Check size={props.size || 16} {...props} />;
export const XIcon = (props) => <X size={props.size || 16} {...props} />;
export const SirenIcon = (props) => <Siren size={props.size || 20} {...props} />;
export const AlertTriangleIcon = (props) => <AlertTriangle size={props.size || 18} {...props} />;
export const BellIcon = (props) => <Bell size={props.size || 18} {...props} />;
export const MapPinIcon = (props) => <MapPin size={props.size || 16} {...props} />;
export const CalendarIcon = (props) => <Calendar size={props.size || 16} {...props} />;
export const ClockIcon = (props) => <Clock size={props.size || 16} {...props} />;
export const PhoneIcon = (props) => <Phone size={props.size || 16} {...props} />;
export const RefreshIcon = (props) => <RefreshCw size={props.size || 16} {...props} />;
export const VolumeOnIcon = (props) => <Volume2 size={props.size || 18} {...props} />;
export const VolumeOffIcon = (props) => <VolumeX size={props.size || 18} {...props} />;
export const UserIcon = (props) => <User size={props.size || 18} {...props} />;
export const UsersIcon = (props) => <Users size={props.size || 18} {...props} />;
export const KeyIcon = (props) => <KeyRound size={props.size || 18} {...props} />;
export const LockIcon = (props) => <Lock size={props.size || 18} {...props} />;
export const PlusIcon = (props) => <Plus size={props.size || 18} {...props} />;
export const TrashIcon = (props) => <Trash2 size={props.size || 16} {...props} />;
export const LogoutIcon = (props) => <LogOut size={props.size || 18} {...props} />;
export const DashboardIcon = (props) => <LayoutDashboard size={props.size || 18} {...props} />;
export const ZapIcon = (props) => <Zap size={props.size || 18} {...props} />;
export const FlagIcon = (props) => <Flag size={props.size || 18} {...props} />;
export const MessageSquareIcon = (props) => <MessageSquare size={props.size || 16} {...props} />;
export const SlidersIcon = (props) => <Sliders size={props.size || 18} {...props} />;
export const SearchIcon = (props) => <Search size={props.size || 16} {...props} />;
export const ArrowRightIcon = (props) => <ArrowRight size={props.size || 16} {...props} />;
export const ExternalLinkIcon = (props) => <ExternalLink size={props.size || 14} {...props} />;
export const ShieldIcon = (props) => <Shield size={props.size || 18} {...props} />;
export const FileTextIcon = (props) => <FileText size={props.size || 18} {...props} />;
export const BuildingIcon = (props) => <Building size={props.size || 16} {...props} />;
export const NavigationIcon = (props) => <Navigation size={props.size || 16} {...props} />;
export const SendIcon = (props) => <Send size={props.size || 16} {...props} />;
export const InfoIcon = (props) => <Info size={props.size || 16} {...props} />;
export const EyeIcon = (props) => <Eye size={props.size || 16} {...props} />;
export const EyeOffIcon = (props) => <EyeOff size={props.size || 16} {...props} />;
export const EditIcon = (props) => <Edit3 size={props.size || 16} {...props} />;
export const CopyIcon = (props) => <Copy size={props.size || 16} {...props} />;

