import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, API } from '../services/db';
import { useLMS } from '../store';
import { StudentCohort, UserRole } from '../types';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
};

const extractInviteCode = (input: string): string | null => {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  if (/^COH-[A-Z0-9-]+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  try {
    const parsed = new URL(trimmed);
    const fromQuery = parsed.searchParams.get('cohortInvite');
    if (fromQuery && /^COH-[A-Z0-9-]+$/i.test(fromQuery.trim())) {
      return fromQuery.trim().toUpperCase();
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const candidate = segments[segments.length - 1];
    if (candidate && /^COH-[A-Z0-9-]+$/i.test(candidate.trim())) {
      return candidate.trim().toUpperCase();
    }
  } catch {
    return null;
  }

  return null;
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const Dashboard: React.FC = () => {
  const { currentUser, courses, refreshData } = useLMS();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [myCohorts, setMyCohorts] = useState<StudentCohort[]>([]);
  const [cohortInput, setCohortInput] = useState('');
  const [isCohortLoading, setIsCohortLoading] = useState(false);
  const [isJoiningCohort, setIsJoiningCohort] = useState(false);
  const [cohortError, setCohortError] = useState<string | null>(null);
  const [cohortNotice, setCohortNotice] = useState<string | null>(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return courses;
    }

    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query),
    );
  }, [courses, searchQuery]);

  useEffect(() => {
    if (isAdmin || !currentUser) {
      setMyCohorts([]);
      return;
    }

    const loadCohorts = async () => {
      setIsCohortLoading(true);
      setCohortError(null);

      try {
        const cohorts = await API.fetchMyCohorts();
        setMyCohorts(cohorts);
      } catch (loadError) {
        setCohortError(getErrorMessage(loadError));
      } finally {
        setIsCohortLoading(false);
      }
    };

    void loadCohorts();
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      return;
    }

    const queryCode = new URLSearchParams(window.location.search).get(
      'cohortInvite',
    );
    if (queryCode) {
      setCohortInput(queryCode);
    }
  }, [isAdmin]);

  const handleJoinCohort = async (event: React.FormEvent) => {
    event.preventDefault();
    setCohortError(null);
    setCohortNotice(null);

    const normalizedInput = cohortInput.trim();
    if (!normalizedInput) {
      setCohortError('Enter a cohort invite link/code or access key.');
      return;
    }

    setIsJoiningCohort(true);

    try {
      const inviteCode = extractInviteCode(normalizedInput);
      const response = inviteCode
        ? await API.joinCohortByInviteCode(inviteCode)
        : await API.joinCohortByKey(normalizedInput);

      const allocationMessage =
        response.allocatedCourses > 0
          ? `${response.allocatedCourses} course${
              response.allocatedCourses > 1 ? 's were' : ' was'
            } unlocked.`
          : 'No new courses were unlocked.';

      setCohortNotice(`${response.message} ${allocationMessage}`);
      setCohortInput('');

      await refreshData();
      const cohorts = await API.fetchMyCohorts();
      setMyCohorts(cohorts);
    } catch (joinError) {
      setCohortError(getErrorMessage(joinError));
    } finally {
      setIsJoiningCohort(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Course Catalog Control' : `Welcome back, ${currentUser?.name}!`}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {isAdmin
              ? 'Use Course Admin and Access Admin for management tasks.'
              : 'These are the courses allocated to your account.'}
          </p>
        </div>

        <div className="relative group w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <i className="fas fa-search text-slate-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold shadow-sm focus:ring-4 focus:ring-nitrocrimson-500/10 focus:border-nitrocrimson-600 outline-none transition-all placeholder:text-slate-300"
          />
        </div>
      </header>

      {!isAdmin && (
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <h2 className="text-2xl font-black text-slate-900">Join Cohort</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Paste a cohort invite link/code or enter the special access key.
          </p>

          <form onSubmit={handleJoinCohort} className="mt-5 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={cohortInput}
              onChange={(event) => setCohortInput(event.target.value)}
              placeholder="https://.../?cohortInvite=COH-XXXX or KEY-XXXX"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold text-sm"
            />
            <button
              type="submit"
              disabled={isJoiningCohort}
              className="px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
            >
              {isJoiningCohort ? 'Joining...' : 'Join Cohort'}
            </button>
          </form>

          {(cohortError || cohortNotice) && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
                cohortError
                  ? 'bg-red-50 border border-red-100 text-red-600'
                  : 'bg-green-50 border border-green-100 text-green-700'
              }`}
            >
              {cohortError ?? cohortNotice}
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
              My Cohorts
            </p>
            {isCohortLoading ? (
              <p className="text-sm text-slate-500">Loading cohorts...</p>
            ) : myCohorts.length === 0 ? (
              <p className="text-sm text-slate-500">You have not joined any cohort yet.</p>
            ) : (
              <div className="space-y-2">
                {myCohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3"
                  >
                    <p className="text-sm font-black text-slate-900">{cohort.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Joined {formatDate(cohort.joinedAt)} via {cohort.joinedBy} |{' '}
                      {cohort.courseIds.length} course
                      {cohort.courseIds.length === 1 ? '' : 's'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-inner">
          <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <i className="fas fa-book text-4xl text-slate-200"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {searchQuery ? 'No matching courses' : isAdmin ? 'No courses yet' : 'No allocated courses yet'}
          </h3>
          <p className="text-slate-400 mt-3 max-w-sm mx-auto font-medium">
            {searchQuery
              ? 'Try a different keyword.'
              : isAdmin
                ? 'Go to Admin and create your first course.'
                : 'Join a cohort or ask your admin to allocate a course.'}
          </p>
        </div>
      ) : (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="relative h-52">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-nitrocrimson-600 text-[10px] font-black uppercase rounded-full shadow-lg tracking-wider">
                      {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-xl font-black text-slate-900 line-clamp-1 tracking-tight">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-2 line-clamp-3 min-h-[4.5rem]">
                    {course.description}
                  </p>

                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="w-full mt-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 text-white group-hover:bg-nitrocrimson-600 shadow-lg shadow-slate-100 transition-all"
                  >
                    Open Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
