import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLMS } from '../store';
import { CourseStudent, CourseView, UserRole } from '../types';

type VideoSource = {
  kind: 'file' | 'embed' | 'external';
  src: string;
};

type SelectedLesson = {
  sectionIndex: number;
  subsectionIndex: number;
  sectionTitle: string;
  title: string;
  description?: string;
  videoUrl: string;
};

const DIRECT_VIDEO_FILE_PATTERN = /\.(mp4|webm|ogg|mov|m4v|m3u8)(\?.*)?$/i;

const formatDate = (value: string | undefined) => {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getYouTubeVideoId = (url: URL): string | null => {
  const hostname = url.hostname.replace(/^www\./, '').toLowerCase();

  if (hostname === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ?? null;
  }

  if (hostname.endsWith('youtube.com')) {
    if (url.pathname === '/watch') {
      return url.searchParams.get('v');
    }

    const segments = url.pathname.split('/').filter(Boolean);

    if (segments[0] === 'embed' || segments[0] === 'shorts') {
      return segments[1] ?? null;
    }
  }

  return null;
};

const getVimeoVideoId = (url: URL): string | null => {
  const hostname = url.hostname.replace(/^www\./, '').toLowerCase();

  if (!hostname.endsWith('vimeo.com')) {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  return segments.find((segment) => /^\d+$/.test(segment)) ?? null;
};

const resolveVideoSource = (videoUrl: string): VideoSource => {
  const trimmedUrl = videoUrl.trim();

  if (!trimmedUrl) {
    return {
      kind: 'external',
      src: '',
    };
  }

  if (trimmedUrl.startsWith('blob:')) {
    return {
      kind: 'file',
      src: trimmedUrl,
    };
  }

  try {
    const url = new URL(trimmedUrl);

    const youtubeVideoId = getYouTubeVideoId(url);
    if (youtubeVideoId) {
      return {
        kind: 'embed',
        src: `https://www.youtube.com/embed/${youtubeVideoId}`,
      };
    }

    const vimeoVideoId = getVimeoVideoId(url);
    if (vimeoVideoId) {
      return {
        kind: 'embed',
        src: `https://player.vimeo.com/video/${vimeoVideoId}`,
      };
    }

    if (DIRECT_VIDEO_FILE_PATTERN.test(url.pathname)) {
      return {
        kind: 'file',
        src: trimmedUrl,
      };
    }

    return {
      kind: 'external',
      src: trimmedUrl,
    };
  } catch {
    if (DIRECT_VIDEO_FILE_PATTERN.test(trimmedUrl)) {
      return {
        kind: 'file',
        src: trimmedUrl,
      };
    }

    return {
      kind: 'external',
      src: trimmedUrl,
    };
  }
};

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser, fetchCourseView, fetchCourseStudents } = useLMS();

  const [courseView, setCourseView] = useState<CourseView | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<SelectedLesson | null>(
    null,
  );
  const [playerNotice, setPlayerNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const iframeElementRef = useRef<HTMLIFrameElement | null>(null);

  const selectedVideoSource = useMemo(() => {
    if (!selectedLesson) {
      return null;
    }

    return resolveVideoSource(selectedLesson.videoUrl);
  }, [selectedLesson]);

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        setError('Invalid course route.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const view = await fetchCourseView(courseId);

        if (!view) {
          setError('Course not found or access denied.');
          setCourseView(null);
          return;
        }

        setCourseView(view);

        if (currentUser?.role === UserRole.ADMIN) {
          const roster = await fetchCourseStudents(courseId);
          setStudents(roster);
        } else {
          setStudents([]);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load course details',
        );
        setCourseView(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [courseId, currentUser?.role, fetchCourseStudents, fetchCourseView]);

  useEffect(() => {
    const sections = courseView?.course.sections ?? [];

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const section = sections[sectionIndex];

      if (section.subsections.length === 0) {
        continue;
      }

      const firstSubsection = section.subsections[0];

      setSelectedLesson({
        sectionIndex,
        subsectionIndex: 0,
        sectionTitle: section.title,
        title: firstSubsection.title,
        description: firstSubsection.description,
        videoUrl: firstSubsection.videoUrl,
      });
      return;
    }

    setSelectedLesson(null);
  }, [courseView?.course.id, courseView?.course.updatedAt]);

  useEffect(() => {
    setPlayerNotice(null);
  }, [selectedLesson?.videoUrl]);

  const handleEnterFullscreen = async () => {
    const targetElement =
      selectedVideoSource?.kind === 'file'
        ? videoElementRef.current
        : iframeElementRef.current;

    if (!targetElement || !targetElement.requestFullscreen) {
      setPlayerNotice('Fullscreen is not available for this video source.');
      return;
    }

    try {
      await targetElement.requestFullscreen();
    } catch {
      setPlayerNotice(
        'Unable to open fullscreen for this video. You can still open it in a new tab.',
      );
    }
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-20 text-center">
        <i className="fas fa-circle-notch fa-spin text-3xl text-nitrocrimson-600"></i>
        <p className="mt-4 font-black text-slate-500 uppercase tracking-widest text-xs">
          Loading course details...
        </p>
      </div>
    );
  }

  if (!courseView || error) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center">
        <i className="fas fa-triangle-exclamation text-3xl text-red-500"></i>
        <p className="mt-4 text-sm font-bold text-slate-600">
          {error ?? 'Unable to load this course.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
        >
          Back
        </button>
      </div>
    );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const { course } = courseView;

  return (
    <div className="space-y-8 animate-fadeIn pb-20 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="group text-slate-400 hover:text-nitrocrimson-600 font-black flex items-center transition-colors text-sm uppercase tracking-widest"
      >
        <i className="fas fa-chevron-left mr-3 group-hover:-translate-x-1 transition-transform"></i>
        Back to Dashboard
      </button>

      <section className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="relative h-72">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
          <div className="absolute bottom-0 p-10 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-nitrocrimson-300 mb-3">
              {isAdmin ? 'Admin View' : 'Student View'}
            </p>
            <h1 className="text-4xl font-black tracking-tight">{course.title}</h1>
          </div>
        </div>

        <div className="p-10 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
              <h2 className="text-xl font-black text-slate-900 mb-4">Description</h2>
              <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                {course.description}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] p-8">
              <h2 className="text-xl font-black text-slate-900 mb-2">Course Content</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">
                {course.sections.length} sections •{' '}
                {course.sections.reduce(
                  (total, section) => total + section.subsections.length,
                  0,
                )}{' '}
                lessons
              </p>

              {selectedLesson && selectedVideoSource && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  {selectedVideoSource.kind === 'file' && (
                    <video
                      ref={videoElementRef}
                      src={selectedVideoSource.src}
                      controls
                      preload="metadata"
                      className="w-full aspect-video bg-black"
                    />
                  )}

                  {selectedVideoSource.kind === 'embed' && (
                    <iframe
                      ref={iframeElementRef}
                      src={selectedVideoSource.src}
                      title={`Lesson: ${selectedLesson.title}`}
                      className="w-full aspect-video bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )}

                  {selectedVideoSource.kind === 'external' && (
                    <div className="w-full aspect-video bg-black text-slate-300 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <p className="text-sm font-bold">
                        This video URL cannot be embedded directly.
                      </p>
                      <a
                        href={selectedLesson.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-slate-100"
                      >
                        <i className="fas fa-arrow-up-right-from-square"></i>
                        Open Video in New Tab
                      </a>
                    </div>
                  )}

                  <div className="px-5 py-4 border-t border-slate-700/60">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {selectedLesson.sectionTitle}
                        </p>
                        <p className="text-white font-black mt-1">{selectedLesson.title}</p>
                        {selectedLesson.description && (
                          <p className="text-xs text-slate-300 mt-2 whitespace-pre-line">
                            {selectedLesson.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleEnterFullscreen}
                          disabled={selectedVideoSource.kind === 'external'}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Full Screen
                        </button>
                        <a
                          href={selectedLesson.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-600"
                        >
                          Open Tab
                        </a>
                      </div>
                    </div>

                    {playerNotice && (
                      <p className="mt-3 text-xs font-bold text-amber-200">{playerNotice}</p>
                    )}
                  </div>
                </div>
              )}

              {course.sections.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium">
                  No content sections added yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {course.sections.map((section, sectionIndex) => (
                    <div
                      key={`section-${sectionIndex}`}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-5"
                    >
                      <h3 className="font-black text-slate-900">
                        {sectionIndex + 1}. {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">
                          {section.description}
                        </p>
                      )}

                      {section.subsections.length === 0 ? (
                        <p className="text-xs text-slate-400 mt-3 font-medium">
                          No lessons in this section yet.
                        </p>
                      ) : (
                        <div className="space-y-3 mt-4">
                          {section.subsections.map((subsection, subsectionIndex) => {
                            const isSelected =
                              selectedLesson?.sectionIndex === sectionIndex &&
                              selectedLesson?.subsectionIndex === subsectionIndex;

                            return (
                              <div
                                key={`subsection-${sectionIndex}-${subsectionIndex}`}
                                className={`bg-white border rounded-xl p-4 ${
                                  isSelected
                                    ? 'border-nitrocrimson-300 shadow-sm shadow-nitrocrimson-100'
                                    : 'border-slate-200'
                                }`}
                              >
                                <p className="text-sm font-black text-slate-900">
                                  {sectionIndex + 1}.{subsectionIndex + 1}{' '}
                                  {subsection.title}
                                </p>
                                {subsection.description && (
                                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">
                                    {subsection.description}
                                  </p>
                                )}

                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedLesson({
                                        sectionIndex,
                                        subsectionIndex,
                                        sectionTitle: section.title,
                                        title: subsection.title,
                                        description: subsection.description,
                                        videoUrl: subsection.videoUrl,
                                      })
                                    }
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-nitrocrimson-600"
                                  >
                                    <i className="fas fa-play-circle"></i>
                                    {isSelected ? 'Now Playing' : 'Play in Site'}
                                  </button>
                                  <a
                                    href={subsection.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200"
                                  >
                                    <i className="fas fa-arrow-up-right-from-square"></i>
                                    Open Tab
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isAdmin && (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8">
                <h2 className="text-xl font-black text-slate-900 mb-4">
                  Access Information
                </h2>
                <p className="text-sm text-slate-600 font-medium">
                  Allocated on:{' '}
                  <span className="font-black text-slate-900">
                    {formatDate(courseView.allocatedAt)}
                  </span>
                </p>
                <p className="text-sm text-slate-600 mt-3">
                  Your role is read-only for course content. Contact admin for new
                  allocations.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isAdmin && (
              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  Course Meta
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-500">Price</span>
                    <span className="font-black text-slate-900">
                      {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-500">Created</span>
                    <span className="font-black text-slate-900">
                      {formatDate(course.createdAt)}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-500">Updated</span>
                    <span className="font-black text-slate-900">
                      {formatDate(course.updatedAt)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Allocated Students</h2>
          <p className="text-sm text-slate-400 font-medium mb-8">
            Students who currently have access to this course.
          </p>

          {students.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-bold">
                No students allocated yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((entry) => (
                <div
                  key={entry.enrollmentId}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
                >
                  <p className="font-black text-slate-900">{entry.student.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{entry.student.email}</p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-nitrocrimson-600 mt-3">
                    Allocated: {formatDate(entry.allocatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CoursePlayer;
