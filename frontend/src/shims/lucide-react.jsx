import React from "react"

function createIcon(label) {
  return function Icon(props) {
    const { size = 16, color = "currentColor", ...rest } = props || {}
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
          color
        }}
        {...rest}
      >
        {label.slice(0, 1)}
      </span>
    )
  }
}

export const Activity = createIcon("Activity")
export const AlertCircle = createIcon("AlertCircle")
export const AlertOctagon = createIcon("AlertOctagon")
export const AlertTriangle = createIcon("AlertTriangle")
export const ArrowDownCircle = createIcon("ArrowDownCircle")
export const ArrowLeft = createIcon("ArrowLeft")
export const ArrowUpCircle = createIcon("ArrowUpCircle")
export const ArrowUpDown = createIcon("ArrowUpDown")
export const BarChart3 = createIcon("BarChart3")
export const Briefcase = createIcon("Briefcase")
export const Building2 = createIcon("Building2")
export const Calendar = createIcon("Calendar")
export const CalendarDays = createIcon("CalendarDays")
export const Check = createIcon("Check")
export const CheckCircle = createIcon("CheckCircle")
export const CheckCircle2 = createIcon("CheckCircle2")
export const CheckSquare = createIcon("CheckSquare")
export const ChevronLeft = createIcon("ChevronLeft")
export const ChevronRight = createIcon("ChevronRight")
export const ChevronsUpDown = createIcon("ChevronsUpDown")
export const ClipboardList = createIcon("ClipboardList")
export const Clock = createIcon("Clock")
export const Columns = createIcon("Columns")
export const Database = createIcon("Database")
export const DollarSign = createIcon("DollarSign")
export const Download = createIcon("Download")
export const Edit = createIcon("Edit")
export const ExternalLink = createIcon("ExternalLink")
export const Eye = createIcon("Eye")
export const FileText = createIcon("FileText")
export const FileWarning = createIcon("FileWarning")
export const Filter = createIcon("Filter")
export const FilterX = createIcon("FilterX")
export const History = createIcon("History")
export const Info = createIcon("Info")
export const Layout = createIcon("Layout")
export const LayoutGrid = createIcon("LayoutGrid")
export const LayoutList = createIcon("LayoutList")
export const ListFilter = createIcon("ListFilter")
export const Loader2 = createIcon("Loader2")
export const MapPin = createIcon("MapPin")
export const MessageSquare = createIcon("MessageSquare")
export const Minus = createIcon("Minus")
export const Package = createIcon("Package")
export const Palette = createIcon("Palette")
export const Paperclip = createIcon("Paperclip")
export const Pencil = createIcon("Pencil")
export const Plane = createIcon("Plane")
export const Plus = createIcon("Plus")
export const Save = createIcon("Save")
export const Search = createIcon("Search")
export const Shield = createIcon("Shield")
export const ShieldCheck = createIcon("ShieldCheck")
export const Smartphone = createIcon("Smartphone")
export const Star = createIcon("Star")
export const Tag = createIcon("Tag")
export const Target = createIcon("Target")
export const Timer = createIcon("Timer")
export const Trash2 = createIcon("Trash2")
export const TrendingDown = createIcon("TrendingDown")
export const TrendingUp = createIcon("TrendingUp")
export const Upload = createIcon("Upload")
export const UserCog = createIcon("UserCog")
export const Users = createIcon("Users")
export const Wrench = createIcon("Wrench")
export const X = createIcon("X")
export const XCircle = createIcon("XCircle")
export const Zap = createIcon("Zap")
export const LayoutDashboard = createIcon("LayoutDashboard")
export const PlusCircle = createIcon("PlusCircle")
export const Settings = createIcon("Settings")
export const Menu = createIcon("Menu")
export const PieChart = createIcon("PieChart")
export const Home = createIcon("Home")
export const ChevronDown = createIcon("ChevronDown")
export const HardHat = createIcon("HardHat")
export const FolderOpen = createIcon("FolderOpen")
export const User = createIcon("User")
export const LogOut = createIcon("LogOut")
export const CalendarIcon = createIcon("CalendarIcon")
export const ImageIcon = createIcon("ImageIcon")
