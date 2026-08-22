import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import Loading from "../../components/student/Loading";
import { toast } from "react-toastify";
import axios from "axios";

const Dashboard = () => {
  const { currency, backendUrl, getToken, isEducator } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    if (!isEducator) return;

    let cancelled = false;
    const loadDashboard = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(
          backendUrl + "/api/educator/dashboard",
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!cancelled) {
          if (data.success) {
            setDashboardData(data.dashboardData);
          } else {
            toast.error(data.message);
          }
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [backendUrl, getToken, isEducator]);

  return dashboardData ? (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="space-y-5 w-full">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          <div className="flex items-center gap-4 border border-cyan-700/40 rounded-xl px-8 py-8 bg-white">
            <img src={assets.patients_icon} alt="patients_icon" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalStudents}
              </p>
              <p className="text-base text-gray-500">Enrolled Students</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-cyan-700/40 rounded-xl px-8 py-8 bg-white">
            <img src={assets.person_tick_icon} alt="enrolments_icon" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalEnrollments}
              </p>
              <p className="text-base text-gray-500">Total Enrolments</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-cyan-700/40 rounded-xl px-8 py-8 bg-white">
            <img src={assets.appointments_icon} alt="patients_icon" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {dashboardData.totalCourses}
              </p>
              <p className="text-base text-gray-500">Published Courses</p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-cyan-700/40 rounded-xl px-8 py-8 bg-white">
            <img src={assets.earning_icon} alt="patients_icon" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {currency}
                {Number(dashboardData.totalEarnings).toFixed(2)}
              </p>
              <p className="text-base text-gray-500">Total Earnings</p>
            </div>
          </div>
          <div className="sm:col-span-2 xl:col-span-4">
            <h2 className="pb-4 text-lg font-medium">Latest Enrollments</h2>
            <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
              <table className="table-fixed md:table-auto w-full overflow-hidden">
                <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">
                      #
                    </th>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    <th className="px-4 py-3 font-semibold">Course Title</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-500">
                  {dashboardData.enrolledStudentsData.map((item, index) => (
                    <tr
                      key={item.purchaseId}
                      className="border-b border-gray-500/20"
                    >
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {index + 1}
                      </td>
                      <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                        <img
                          src={item.student.imageUrl}
                          alt="profile"
                          className="w-9 h-9 rounded-full"
                        />
                        <span className="truncate">{item.student.name}</span>
                      </td>
                      <td className="px-4 py-3 truncate">
                        {item.courseTitle}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {new Date(item.purchaseDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {dashboardData.enrolledStudentsData.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No enrollments yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Dashboard;
