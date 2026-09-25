import { motion } from "framer-motion";
import { Bug, Calendar, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import useCanHover from "../../helper/useCanHover";
import type {
  ReportBug,
  ReportEvent,
  ReportUser,
  SortColumn,
  SortDirection,
  UnifiedReport,
} from "../../types/dashboardReport";

import Filter from "../AddEvents/Filter";
import ReportPagination from "./components/ReportPagination";
import ReportStatCard from "./components/ReportStatCard";
import ReportTable from "./components/ReportTable";

import "./DashboardReport.css";

type FilterType = "all" | "ongoing" | "finished";

const REPORTS_PER_PAGE = 7;

function getDefaultSort(filter: FilterType): {
  column: SortColumn;
  direction: SortDirection;
} {
  if (filter === "all") return { column: "status", direction: "asc" };
  return { column: "date", direction: "asc" };
}

function DashboardReport() {
  const canHover = useCanHover();
  const [reportBug, setReportBug] = useState<ReportBug[]>([]);
  const [reportUser, setReportUser] = useState<ReportUser[]>([]);
  const [reportEvent, setReportEvent] = useState<ReportEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ongoing");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/reportUser`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setReportUser(data));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/reportBug`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setReportBug(data));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/reportEvent`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setReportEvent(data));
  }, []);

  const allReports: UnifiedReport[] = [
    ...reportBug.map((r) => ({
      id: r.reported_bug_id,
      type: "bug" as const,
      username: r.username,
      email: r.email,
      date: r.reported_bug_date,
      is_done: r.reported_bug_is_done,
    })),
    ...reportUser.map((r) => ({
      id: r.reported_user_id,
      type: "user" as const,
      username: r.username,
      email: r.email,
      date: r.reported_user_date,
      is_done: r.reported_user_is_done,
    })),
    ...reportEvent.map((r) => ({
      id: r.reported_event_id,
      type: "event" as const,
      username: r.username,
      email: r.email,
      date: r.reported_event_date,
      is_done: r.reported_event_is_done,
    })),
  ];

  const filteredReports = allReports.filter((report) => {
    if (activeFilter === "ongoing") return Number(report.is_done) === 0;
    if (activeFilter === "finished") return Number(report.is_done) === 1;
    return true;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === "user") {
      comparison = a.username.localeCompare(b.username);
    } else if (sortColumn === "type") {
      comparison = a.type.localeCompare(b.type);
    } else if (sortColumn === "date") {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortColumn === "status") {
      comparison = Number(a.is_done) - Number(b.is_done);
      if (comparison === 0) {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedReports.length / REPORTS_PER_PAGE) || 1;

  const paginatedReports = sortedReports.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE,
  );

  function handleFilterChange(filter: FilterType) {
    setActiveFilter(filter);
    setCurrentPage(1);
    const { column, direction } = getDefaultSort(filter);
    setSortColumn(column);
    setSortDirection(direction);
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  }

  function handleView(report: UnifiedReport) {
    navigate(`/admin/report/${report.type}/${report.id}`);
  }

  return (
    <motion.main
      className="DashboardReport-global"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.section
        className="DashboardReport-Grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.12,
            },
          },
        }}
      >
        {[
          {
            icon: <Calendar />,
            label: "Signalements d'événements",
            count: reportEvent.length,
            iconClassName: "Icon-Events",
          },
          {
            icon: <Users />,
            label: "Signalements d'utilisateurs",
            count: reportUser.length,
            iconClassName: "Icon-Users",
          },
          {
            icon: <Bug />,
            label: "Signalements de bugs",
            count: reportBug.length,
            iconClassName: "Icon-Bugs",
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={canHover ? { y: -6 } : undefined}
            transition={{ duration: 0.25 }}
          >
            <ReportStatCard
              icon={stat.icon}
              label={stat.label}
              count={stat.count}
              iconClassName={stat.iconClassName}
            />
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        className="DashboardReport-TableSection"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div className="HomeEvents-FilterAdd">
          <Filter
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </div>
        {paginatedReports.length > 0 ? (
          <>
            <ReportTable
              reports={paginatedReports}
              onView={handleView}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <ReportPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <p className="DashboardReport-Empty">Aucun signalement trouvé.</p>
        )}
      </motion.section>
    </motion.main>
  );
}

export default DashboardReport;
