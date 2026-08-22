import { createContext, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";

// This module intentionally exports the shared context and its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();
export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolledCoursesLoaded, setEnrolledCoursesLoaded] = useState(false);
  const [userData, setUserData] = useState(null);

  //Function to calculate average rating of course
  const calculateRating = (course) => {
    if (course.courseRatings.length === 0) {
      return 0;
    }
    let totalRating = 0;
    course.courseRatings.forEach((rating) => {
      totalRating += rating.rating;
    });
    return Math.floor(totalRating / course.courseRatings.length);
  };

  // functiond to calculate course chapter time
  const calculateChapterTime = (chapter) => {
    let time = 0;
    chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration));
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // function to calculate course duration
  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent.map((chapter) =>
      chapter.chapterContent.map(
        (lecture) => (time += lecture.lectureDuration),
      ),
    );
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  //function to calculate no of lect in the course
  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });
    return totalLectures;
  };

  //Fetch user enrolled courses
  const fetchUserEnrolledCourses = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        backendUrl + "/api/user/enrolled-courses",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data.success) {
        const courses = [...data.enrolledCourses].reverse();
        setEnrolledCourses(courses);
        setEnrolledCoursesLoaded(true);
        return courses;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }

    setEnrolledCoursesLoaded(true);
    return [];
  }, [backendUrl, getToken]);

  useEffect(() => {
    let cancelled = false;
    const loadCourses = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/course/all");
        if (!cancelled) {
          if (data.success) {
            setAllCourses(data.courses);
          } else {
            toast.error(data.message);
          }
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      }
    };

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const loadUser = async () => {
      try {
        const token = await getToken();
        const [userResponse, coursesResponse] = await Promise.all([
          axios.get(backendUrl + "/api/user/data", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(backendUrl + "/api/user/enrolled-courses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!cancelled) {
          setIsEducator(user.publicMetadata.role === "educator");

          if (userResponse.data.success) {
            setUserData(userResponse.data.user);
          } else {
            toast.error(userResponse.data.message);
          }

          if (coursesResponse.data.success) {
            setEnrolledCourses([...coursesResponse.data.enrolledCourses].reverse());
          } else {
            toast.error(coursesResponse.data.message);
          }
          setEnrolledCoursesLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setEnrolledCoursesLoaded(true);
          toast.error(error.message);
        }
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [backendUrl, getToken, user]);

  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    isEducator,
    setIsEducator,
    calculateChapterTime,
    calculateNoOfLectures,
    calculateCourseDuration,
    enrolledCourses,
    enrolledCoursesLoaded,
    setEnrolledCourses,
    fetchUserEnrolledCourses,
    backendUrl,
    userData,
    setUserData,
    getToken,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
