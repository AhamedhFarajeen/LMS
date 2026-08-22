import React, { useContext, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";

const Loading = () => {
  const { path } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { backendUrl, getToken, fetchUserEnrolledCourses } =
    useContext(AppContext);
  const courseId = searchParams.get("courseId");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    let cancelled = false;

    const finishEnrollment = async () => {
      // When Loading is rendered inside another page, it has no route path and
      // should only display the spinner without navigating away.
      if (!path) return;

      if (path !== "player" || !courseId) {
        navigate(`/${path}`, { replace: true });
        return;
      }

      for (let attempt = 0; attempt < 10 && !cancelled; attempt += 1) {
        try {
          const token = await getToken();

          if (sessionId) {
            const { data } = await axios.post(
              `${backendUrl}/api/user/complete-purchase`,
              { sessionId },
              { headers: { Authorization: `Bearer ${token}` } },
            );

            if (data.success) {
              await fetchUserEnrolledCourses();
              navigate(`/player/${data.courseId}`, { replace: true });
              return;
            }
          } else {
            const courses = await fetchUserEnrolledCourses();
            if (courses.some((course) => course._id === courseId)) {
              navigate(`/player/${courseId}`, { replace: true });
              return;
            }
          }
        } catch {
          // The payment webhook and authentication can take a moment to settle.
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      if (!cancelled) {
        toast.error("Enrollment is still processing. Please try again shortly.");
        navigate(`/course/${courseId}`, { replace: true });
      }
    };

    finishEnrollment();

    return () => {
      cancelled = true;
    };
  }, [
    backendUrl,
    courseId,
    fetchUserEnrolledCourses,
    getToken,
    navigate,
    path,
    sessionId,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 sm:w-20 aspect-square border-4 border-gray-300 border-t-4 border-t-blue-400 rounded-full animate-spin"></div>
    </div>
  );
};

export default Loading;
