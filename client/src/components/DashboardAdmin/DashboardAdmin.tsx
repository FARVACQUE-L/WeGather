import { useEffect, useState } from "react";
import "./DashboardAdmin.css";
import { motion } from "framer-motion";
import {
  Calendar,
  ChartNoAxesCombined,
  Flag,
  TriangleAlert,
  User,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AllReports = {
  reported_user_id: number;
  reported_event_id: number;
  reported_bug_id: number;
};
type AllUsers = {
  user_id: number;
};
type AllEvents = {
  event_id: number;
};
type ArrayReport = {
  user_name: string;
  report_type: "user" | "bug" | "event";
  description: string;
  report_date: string;
};
type ArrayUser = {
  user_id: number;
  user_name: string;
  user_username: string;
  user_profile_picture: string;
  user_joining_date: string;
};
type GraphicAdmin = {
  month_number: number;
  month: string;
  users: number;
  events: number;
  reports: number;
};
function DashboardAdmin() {
  const [reportBug, setReportBug] = useState<AllReports[]>([]);
  const [reportUser, setReportUser] = useState<AllReports[]>([]);
  const [reportEvent, setReportEvent] = useState<AllReports[]>([]);
  const [allUsers, setAllUsers] = useState<AllUsers[]>([]);
  const [allEvents, setAllEvents] = useState<AllEvents[]>([]);
  const [arrayReport, setArrayReport] = useState<ArrayReport[]>([]);
  const [arrayUser, setArrayUser] = useState<ArrayUser[]>([]);
  const [graphic, setGraphic] = useState<GraphicAdmin[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

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
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAllUsers(data));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/events`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAllEvents(data));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/arrayReport`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setArrayReport(data));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/arrayUser`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setArrayUser(data));
  }, []);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-years`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) =>
        setAvailableYears(data.map((row: { year: number }) => row.year)),
      );
  }, []);
  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/dashboard-chart?year=${selectedYear}`,
      { credentials: "include" },
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGraphic(data);
        } else if (Array.isArray(data.result)) {
          setGraphic(data.result);
        } else if (Array.isArray(data.rows)) {
          setGraphic(data.rows);
        } else {
          setGraphic([]);
        }
      });
  }, [selectedYear]);

  const totalIdsUsers = allUsers.reduce((total, report) => {
    return total + (report.user_id ? 1 : 0);
  }, 0);

  const totalIdsEvents = allEvents.reduce((total, report) => {
    return total + (report.event_id ? 1 : 0);
  }, 0);

  const totalReports =
    reportBug.length + reportEvent.length + reportUser.length;

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR");
  }

  return (
    <motion.main
      className="admin-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.section
        className="stats-grid"
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
            label: "Total des evenements",
            value: totalIdsEvents,
          },
          {
            icon: <Users />,
            label: "Total des utilisateurs",
            value: totalIdsUsers,
          },
          {
            icon: <TriangleAlert />,
            label: "Rapports actifs",
            value: totalReports,
          },
        ].map((stat) => (
          <motion.article
            className="stat-card"
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {stat.icon}
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
          </motion.article>
        ))}
      </motion.section>

      <motion.section
        className="chart-card"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div className="chart-header">
          <div>
            <h2>
              <ChartNoAxesCombined size={20} />
              Activité de la plateforme
            </h2>
            <p>Évolution mensuelle des utilisateurs, événements et reports</p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={graphic}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip wrapperStyle={{ zIndex: 100 }} />
              <Legend />

              <Line
                type="monotone"
                dataKey="users"
                name="Utilisateurs"
                stroke="#5297cf"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="events"
                name="Événements"
                stroke="#059669"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="reports"
                name="Reports"
                stroke="#e11d48"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        className="bottom-grid"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <motion.article
          className="reports-card"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="card-title">
            <h2>
              <Flag size={20} />
              Rapports récents
            </h2>
          </div>

          <div className="tableau-rapport">
            <div className="titre-tableau-rapport">
              <h3>Utilisateur</h3>
              <h3>Ticket</h3>
              <h3>Description</h3>
              <h3>Date</h3>
            </div>

            <div className="contenu-tableau-rapport">
              {arrayReport.map((report) => (
                <motion.div
                  key={`${report.user_name}-${report.report_date}`}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>{report.user_name}</p>
                  <p>{report.report_type}</p>
                  <p>{report.description}</p>
                  <p>{formatDate(report.report_date)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.article>

        <motion.article
          className="users-card"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <div className="card-title">
            <h2>
              <User size={20} />
              Nouveaux utilisateurs
            </h2>
          </div>

          <div className="users-list">
            {arrayUser.map((user) => (
              <motion.div
                className="user-row"
                key={user.user_id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                whileHover={{ x: 6 }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.user_profile_picture}`}
                  alt={user.user_name}
                />

                <div>
                  <h3>{user.user_name}</h3>
                  <p className="user-name-datejoin">
                    {user.user_username} • Rejoint le{" "}
                    {formatDate(user.user_joining_date)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.article>
      </motion.section>
    </motion.main>
  );
}
export default DashboardAdmin;
