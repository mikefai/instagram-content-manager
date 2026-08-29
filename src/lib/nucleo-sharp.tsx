/**
 * Local `nucleo-sharp` shim.
 *
 * The app imports icons via `import { ... } from "nucleo-sharp"`. The real npm
 * package `nucleo-sharp` exports `Icon*`-prefixed components (e.g.
 * `IconCalendar`) and does not ship the icon names this app uses, so the module
 * is aliased to this file — see the `nucleo-sharp` aliases in vite.config.ts and
 * tsconfig.app.json.
 *
 * All icons are 24px line icons from lucide-react, pinned to 0.545.x (the last
 * release that still exports names like `BarChart3`, `Edit3`, `CheckCircle`,
 * `Share2`, `PieChart`, `LineChart` and `AreaChart`, which Lucide 1.x removed).
 * `Hash` has no lucide equivalent (`Hashtag` exists instead) and is drawn here.
 */
import {
  AreaChart,
  BarChart3,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  FileText,
  Filter,
  Heart,
  Image,
  Lightbulb,
  LineChart,
  Link,
  MessageSquare,
  Mic,
  PauseCircle,
  PieChart,
  PlayCircle,
  Plus,
  Repeat,
  Search,
  Send,
  Settings,
  Share2,
  Target,
  Trash2,
  TrendingUp,
  Type,
  Users,
  Video,
  XCircle,
  type LucideProps,
} from "lucide-react";

/** lucide-react has no `Hash` icon (`Hashtag` is the closest) — bare "#" glyph. */
function Hash({ size, strokeWidth = 2, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

export {
  AreaChart,
  BarChart3,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  FileText,
  Filter,
  Hash,
  Heart,
  Image,
  Lightbulb,
  LineChart,
  Link,
  MessageSquare,
  Mic,
  PauseCircle,
  PieChart,
  PlayCircle,
  Plus,
  Repeat,
  Search,
  Send,
  Settings,
  Share2,
  Target,
  Trash2,
  TrendingUp,
  Type,
  Users,
  Video,
  XCircle,
};