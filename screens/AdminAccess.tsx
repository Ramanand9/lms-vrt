import React, { useEffect, useMemo, useState } from 'react';
import { ApiError, API } from '../services/db';
import { useLMS } from '../store';
import { AdminCohort, CourseStudent } from '../types';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
};

const AdminAccess: React.FC = () => {
  const {
    courses,
    students,
    isSaving,
    allocateCourse,
    revokeCourseAccess,
    fetchCourseStudents,
  } = useLMS();

  const [accessCourseId, setAccessCourseId] = useState('');
  const [accessStudentId, setAccessStudentId] = useState('');
  const [roster, setRoster] = useState<CourseStudent[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);

  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [isCohortsLoading, setIsCohortsLoading] = useState(false);
  const [isCohortSaving, setIsCohortSaving] = useState(false);
  const [cohortName, setCohortName] = useState('');
  const [cohortDescription, setCohortDescription] = useState('');
  const [cohortCourseIds, setCohortCourseIds] = useState<string[]>([]);
  const [cohortSecrets, setCohortSecrets] = useState<Record<string, string>>({});

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAccessCourse = useMemo(
    () => courses.find((course) => course.id === accessCourseId),
    [courses, accessCourseId],
  );

  const courseTitleById = useMemo(
    () => new Map(courses.map((course) => [course.id, course.title])),
    [courses],
  );

  useEffect(() => {
    let isMounted = true;

    const loadCohorts = async () => {
      setIsCohortsLoading(true);

      try {
        const data = await API.fetchAdminCohorts();
        if (isMounted) {
          setCohorts(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsCohortsLoading(false);
        }
      }
    };

    void loadCohorts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCohortCourseIds((prev) =>
      prev.filter((courseId) => courses.some((course) => course.id === courseId)),
    );
  }, [courses]);

  const handleAllocate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!accessCourseId || !accessStudentId) {
      setError('Select both course and student to allocate access.');
      return;
    }

    const result = await allocateCourse(accessCourseId, accessStudentId);

    if (!result.success) {
      setError(result.message ?? 'Unable to allocate course.');
      return;
    }

    setMessage('Course allocated successfully.');

    if (accessCourseId) {
      await handleLoadRoster();
    }
  };

  const handleLoadRoster = async () => {
    if (!accessCourseId) {
      setRoster([]);
      return;
    }

    setError(null);
    setMessage(null);
    setIsRosterLoading(true);

    try {
      const data = await fetchCourseStudents(accessCourseId);
      setRoster(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load course roster.',
      );
      setRoster([]);
    } finally {
      setIsRosterLoading(false);
    }
  };

  const handleRevokeAccess = async (studentId: string, studentName: string) => {
    if (!accessCourseId) {
      return;
    }

    setError(null);
    setMessage(null);

    const isConfirmed = window.confirm(`Revoke access for ${studentName}?`);

    if (!isConfirmed) {
      return;
    }

    const result = await revokeCourseAccess(accessCourseId, studentId);

    if (!result.success) {
      setError(result.message ?? 'Unable to revoke access.');
      return;
    }

    setRoster((prev) => prev.filter((entry) => entry.student.id !== studentId));
    setMessage('Access revoked successfully.');
  };

  const toggleCohortCourse = (courseId: string) => {
    setCohortCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((existingCourseId) => existingCourseId !== courseId)
        : [...prev, courseId],
    );
  };

  const handleCreateCohort = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedName = cohortName.trim();
    if (trimmedName.length < 2) {
      setError('Cohort name must be at least 2 characters.');
      return;
    }

    setIsCohortSaving(true);

    try {
      const created = await API.createCohort({
        name: trimmedName,
        description: cohortDescription.trim() || undefined,
        courseIds: cohortCourseIds,
      });

      setCohorts((prev) => [created, ...prev]);
      if (created.accessKey) {
        setCohortSecrets((prev) => ({
          ...prev,
          [created.id]: created.accessKey as string,
        }));
      }

      setCohortName('');
      setCohortDescription('');
      setCohortCourseIds([]);
      setMessage(
        `Cohort created. Invite code: ${created.inviteCode}. Share the key shown below.`,
      );
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsCohortSaving(false);
    }
  };

  const handleRotateCohortKey = async (cohortId: string) => {
    setError(null);
    setMessage(null);
    setIsCohortSaving(true);

    try {
      const response = await API.rotateCohortKey(cohortId);
      setCohortSecrets((prev) => ({
        ...prev,
        [cohortId]: response.accessKey,
      }));
      setMessage('New cohort access key generated.');
    } catch (rotateError) {
      setError(getErrorMessage(rotateError));
    } finally {
      setIsCohortSaving(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setError(null);
      setMessage(`${label} copied.`);
    } catch {
      setError(`Unable to copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-20">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Admin Access</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student allocations, revoke access, and cohorts.
          </p>
        </div>
        {(isSaving || isCohortSaving) && (
          <p className="text-xs font-black uppercase tracking-widest text-nitrocrimson-600">
            Saving...
          </p>
        )}
      </header>

      {(message || error) && (
        <div
          className={`rounded-xl p-3 text-sm font-bold ${
            error
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}
        >
          {error ?? message}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h2 className="text-xl font-black text-slate-900">Student Access</h2>

        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={accessCourseId}
            onChange={(event) => {
              setAccessCourseId(event.target.value);
              setRoster([]);
            }}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleLoadRoster}
            disabled={!accessCourseId || isRosterLoading}
            className="px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {isRosterLoading ? 'Loading...' : 'Load Roster'}
          </button>
        </div>

        <form onSubmit={handleAllocate} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <select
            value={accessStudentId}
            onChange={(event) => setAccessStudentId(event.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
          >
            <option value="">Select student to allocate</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!accessCourseId || !accessStudentId || isSaving}
            className="px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
          >
            Allocate
          </button>
        </form>

        {accessCourseId && (
          <p className="text-sm text-slate-600">
            Course:{' '}
            <span className="font-black text-slate-900">
              {selectedAccessCourse?.title ?? 'Unknown course'}
            </span>
          </p>
        )}

        {roster.length === 0 ? (
          <p className="text-sm text-slate-500">No students allocated yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {roster.map((entry) => (
              <div
                key={entry.enrollmentId}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-black text-slate-900">{entry.student.name}</p>
                  <p className="text-xs text-slate-500">{entry.student.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleRevokeAccess(entry.student.id, entry.student.name)
                  }
                  disabled={isSaving}
                  className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-black text-slate-900">Cohorts</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create cohort invite links or access keys and grant grouped course access.
          </p>
        </div>

        <form onSubmit={handleCreateCohort} className="space-y-3">
          <input
            required
            minLength={2}
            type="text"
            placeholder="Cohort name"
            value={cohortName}
            onChange={(event) => setCohortName(event.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
          />
          <textarea
            value={cohortDescription}
            onChange={(event) => setCohortDescription(event.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-medium h-24"
          />

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Included Courses
            </p>
            {courses.length === 0 ? (
              <p className="text-sm text-slate-500">
                Create courses first, then create cohorts.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {courses.map((course) => {
                  const isChecked = cohortCourseIds.includes(course.id);

                  return (
                    <label
                      key={course.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer ${
                        isChecked
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCohortCourse(course.id)}
                        className="accent-nitrocrimson-600"
                      />
                      <span className="text-sm font-bold truncate">{course.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isCohortSaving || courses.length === 0}
            className="px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
          >
            Create Cohort
          </button>
        </form>

        {isCohortsLoading ? (
          <p className="text-sm text-slate-500">Loading cohorts...</p>
        ) : cohorts.length === 0 ? (
          <p className="text-sm text-slate-500">No cohorts created yet.</p>
        ) : (
          <div className="space-y-3">
            {cohorts.map((cohort) => {
              const visibleAccessKey = cohortSecrets[cohort.id] ?? cohort.accessKey;

              return (
                <div
                  key={cohort.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900">{cohort.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {cohort.memberCount} member
                        {cohort.memberCount === 1 ? '' : 's'} | {cohort.courseIds.length}{' '}
                        course{cohort.courseIds.length === 1 ? '' : 's'}
                      </p>
                      {cohort.description && (
                        <p className="text-xs text-slate-600 mt-2">{cohort.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRotateCohortKey(cohort.id)}
                      disabled={isCohortSaving}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Rotate Key
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">
                        Invite Code
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {cohort.inviteCode}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(cohort.inviteCode, 'Invite code')}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-600"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">
                        Invite Link
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {cohort.inviteLink}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(cohort.inviteLink, 'Invite link')}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-600"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">
                      Access Key
                    </p>
                    {visibleAccessKey ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-900 truncate">
                          {visibleAccessKey}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCopy(visibleAccessKey, 'Access key')}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-600"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Hidden. Rotate key to generate a new one.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1">
                      Courses in Cohort
                    </p>
                    {cohort.courseIds.length === 0 ? (
                      <p className="text-xs text-slate-500">No courses attached.</p>
                    ) : (
                      <p className="text-xs text-slate-700">
                        {cohort.courseIds
                          .map((courseId) => courseTitleById.get(courseId) ?? 'Unknown course')
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAccess;
