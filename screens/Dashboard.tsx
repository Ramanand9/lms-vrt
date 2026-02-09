import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLMS } from '../store';
import { UserRole } from '../types';

const Dashboard: React.FC = () => {
  const { currentUser, courses } = useLMS();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isAdmin ? 'Course Catalog Control' : `Welcome back, ${currentUser?.name}!`}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {isAdmin
              ? 'Manage courses and allocations from the Admin route.'
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
                : 'Ask your admin to allocate a course to your account.'}
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
