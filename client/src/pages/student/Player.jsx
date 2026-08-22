import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import humanizeDuration from "humanize-duration";
import YouTube from "react-youtube";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../../components/student/Loading";
import { getYouTubeVideoId } from "../../utils/youtube";

const getLectureId = (lecture) => lecture.lectureid || lecture.lectureId;

const Player = () => {
  const {
    enrolledCourses,
    enrolledCoursesLoaded,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses,
    navigate,
  } = useContext(AppContext);
  const { courseId } = useParams();
  const [openSection, setOpenSection] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const courseData = enrolledCourses.find((item) => item._id === courseId);
  const initialRating =
    courseData?.courseRatings.find((item) => item.userId === userData?._id)
      ?.rating || 0;

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/update-course-progress",
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data.success) {
        toast.success(data.message);
        setProgressData(data.progressData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRate = async (rating) => {
    try {
      const token = await getToken();

      const { data } = await axios.post(
        backendUrl + "/api/user/add-rating",
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!courseData) return;

    let cancelled = false;
    const loadProgress = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.post(
          backendUrl + "/api/user/get-course-progress",
          { courseId },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!cancelled) {
          if (data.success) {
            setProgressData(data.progressData);
          } else {
            toast.error(data.message);
          }
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      }
    };

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [backendUrl, courseData, courseId, getToken]);

  const toggleSection = (index) => {
    setOpenSection((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const watchLecture = (lecture, chapterIndex, lectureIndex) => {
    const videoId = getYouTubeVideoId(lecture.lectureUrl);

    if (!videoId) {
      toast.error("This lecture does not have a valid YouTube video link.");
      return;
    }

    setPlayerData({
      ...lecture,
      videoId,
      lectureId: getLectureId(lecture),
      chapter: chapterIndex + 1,
      lecture: lectureIndex + 1,
    });
  };

  return courseData ? (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36">
        {/* left column */}
        <div className="text-gray-800">
          <h2 className="texl-xl font-semibold">Course Structure</h2>
          <div className="pt-5">
            {courseData &&
              courseData.courseContent.map((chapter, index) => (
                <div
                  key={index}
                  className="border border-gray-300 bg-white mb-2 rounded"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                    onClick={() => toggleSection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className={`transform transition-transform ${openSection[index] ? "rotate-180" : ""}`}
                        src={assets.down_arrow_icon}
                        alt="arrow icon"
                      />
                      <p className="font-medium md:text-base text-sm">
                        {chapter.chapterTitle}
                      </p>
                    </div>
                    <p className="text-sm md:text-['15px', '21px']">
                      {chapter.chapterContent.length} lectures -{" "}
                      {calculateChapterTime(chapter)}
                    </p>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${openSection[index] ? "max-h-96" : "max-h-0"}`}
                  >
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img
                            src={
                              progressData &&
                              progressData.lectureCompleted.includes(
                                getLectureId(lecture),
                              )
                                ? assets.blue_tick_icon
                                : assets.play_icon
                            }
                            alt="play icon"
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-['15px', '21px']">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2">
                              {lecture.lectureUrl && (
                                <button
                                  type="button"
                                  onClick={() => watchLecture(lecture, index, i)}
                                  className="text-blue-500 cursor-pointer"
                                >
                                  Watch
                                </button>
                              )}
                              <p>
                                {humanizeDuration(
                                  lecture.lectureDuration * 60 * 1000,
                                  { units: ["h", "m"] },
                                )}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex  ">
            <h1 className="text-xl font-bold">Rate this Course:</h1>
            <Rating initialRating={initialRating} onRate={handleRate} />
          </div>
        </div>

        {/* right coloumn */}
        <div className="md:mt-10">
          {playerData ? (
            <div>
              <YouTube
                videoId={playerData.videoId}
                opts={{ playerVars: { autoplay: 1 } }}
                iframeClassName="w-full aspect-video"
              />

              <div className="flex justify-between items-center mt-1">
                <p>
                  {playerData.chapter}.{playerData.lecture}{" "}
                  {playerData.lectureTitle}
                </p>
                <button
                  type="button"
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  className="text-blue-600"
                >
                  {progressData &&
                  progressData.lectureCompleted.includes(playerData.lectureId)
                    ? "Completed"
                    : "Mark As Complete"}
                </button>
              </div>
            </div>
          ) : (
            <img src={courseData ? courseData.courseThumbnail : ""} alt="" />
          )}
        </div>
      </div>
      <Footer />
    </>
  ) : enrolledCoursesLoaded ? (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-gray-800">
        Course access is not available yet
      </h1>
      <p className="text-gray-500">
        Please return to your enrollments and try opening the course again.
      </p>
      <button
        type="button"
        onClick={() => navigate("/my-enrollments")}
        className="rounded bg-blue-600 px-5 py-2.5 text-white"
      >
        My Enrollments
      </button>
    </div>
  ) : (
    <Loading />
  );
};

export default Player;
