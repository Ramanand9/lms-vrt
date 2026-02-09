import React, { useEffect, useMemo, useState } from 'react';
import { useLMS } from '../store';
import { CourseSection, CourseStudent } from '../types';

type EditableSubsection = {
  title: string;
  description: string;
  videoUrl: string;
};

type EditableSection = {
  title: string;
  description: string;
  subsections: EditableSubsection[];
};

const createEmptySubsection = (): EditableSubsection => ({
  title: '',
  description: '',
  videoUrl: '',
});

const createEmptySection = (): EditableSection => ({
  title: '',
  description: '',
  subsections: [],
});

const toEditableSections = (sections: CourseSection[]): EditableSection[] =>
  sections.map((section) => ({
    title: section.title,
    description: section.description ?? '',
    subsections: section.subsections.map((subsection) => ({
      title: subsection.title,
      description: subsection.description ?? '',
      videoUrl: subsection.videoUrl,
    })),
  }));

const toPayloadSections = (sections: EditableSection[]): CourseSection[] =>
  sections.map((section) => ({
    title: section.title,
    description: section.description.trim() || undefined,
    subsections: section.subsections.map((subsection) => ({
      title: subsection.title,
      description: subsection.description?.trim() || undefined,
      videoUrl: subsection.videoUrl,
    })),
  }));

const getLessonCount = (sections: CourseSection[]): number =>
  sections.reduce((total, section) => total + section.subsections.length, 0);

const AdminPanel: React.FC = () => {
  const {
    courses,
    students,
    isSaving,
    createCourse,
    updateCourse,
    allocateCourse,
    fetchCourseStudents,
  } = useLMS();

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    price: '0',
  });

  const [allocationForm, setAllocationForm] = useState({
    courseId: '',
    studentId: '',
  });

  const [selectedEditCourseId, setSelectedEditCourseId] = useState('');
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    price: '0',
    sections: [] as EditableSection[],
  });

  const [selectedRosterCourseId, setSelectedRosterCourseId] = useState('');
  const [roster, setRoster] = useState<CourseStudent[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCourseTitle = useMemo(
    () => courses.find((course) => course.id === selectedRosterCourseId)?.title,
    [courses, selectedRosterCourseId],
  );

  const selectedEditCourseTitle = useMemo(
    () => courses.find((course) => course.id === selectedEditCourseId)?.title,
    [courses, selectedEditCourseId],
  );

  useEffect(() => {
    if (!selectedEditCourseId) {
      setEditCourseForm({
        title: '',
        description: '',
        thumbnailUrl: '',
        price: '0',
        sections: [],
      });
      return;
    }

    const course = courses.find((entry) => entry.id === selectedEditCourseId);

    if (!course) {
      return;
    }

    setEditCourseForm({
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? '',
      price: course.price.toString(),
      sections: toEditableSections(course.sections),
    });
  }, [courses, selectedEditCourseId]);

  const handleCreateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsedPrice = Number.parseFloat(courseForm.price);

    const result = await createCourse({
      title: courseForm.title,
      description: courseForm.description,
      thumbnailUrl: courseForm.thumbnailUrl || undefined,
      price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
      sections: [],
    });

    if (!result.success) {
      setError(result.message ?? 'Unable to create course');
      return;
    }

    setCourseForm({
      title: '',
      description: '',
      thumbnailUrl: '',
      price: '0',
    });
    setMessage('Course created successfully. You can now add sections and videos in Edit Course Content.');
  };

  const handleUpdateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedEditCourseId) {
      setError('Select a course to edit.');
      return;
    }

    const parsedPrice = Number.parseFloat(editCourseForm.price);

    const result = await updateCourse(selectedEditCourseId, {
      title: editCourseForm.title,
      description: editCourseForm.description,
      thumbnailUrl: editCourseForm.thumbnailUrl || undefined,
      price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
      sections: toPayloadSections(editCourseForm.sections),
    });

    if (!result.success) {
      setError(result.message ?? 'Unable to update course');
      return;
    }

    setMessage('Course content updated successfully.');
  };

  const handleAddSection = () => {
    setEditCourseForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection()],
    }));
  };

  const handleRemoveSection = (sectionIndex: number) => {
    setEditCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  const handleSectionChange = (
    sectionIndex: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    setEditCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const handleAddSubsection = (sectionIndex: number) => {
    setEditCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? { ...section, subsections: [...section.subsections, createEmptySubsection()] }
          : section,
      ),
    }));
  };

  const handleRemoveSubsection = (sectionIndex: number, subsectionIndex: number) => {
    setEditCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subsections: section.subsections.filter(
                (_, subIndex) => subIndex !== subsectionIndex,
              ),
            }
          : section,
      ),
    }));
  };

  const handleSubsectionChange = (
    sectionIndex: number,
    subsectionIndex: number,
    field: 'title' | 'description' | 'videoUrl',
    value: string,
  ) => {
    setEditCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subsections: section.subsections.map((subsection, subIndex) =>
                subIndex === subsectionIndex
                  ? { ...subsection, [field]: value }
                  : subsection,
              ),
            }
          : section,
      ),
    }));
  };

  const handleAllocate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!allocationForm.courseId || !allocationForm.studentId) {
      setError('Select both course and student before allocating.');
      return;
    }

    const result = await allocateCourse(
      allocationForm.courseId,
      allocationForm.studentId,
    );

    if (!result.success) {
      setError(result.message ?? 'Unable to allocate course');
      return;
    }

    setMessage('Course allocated successfully.');
  };

  const handleLoadRoster = async () => {
    if (!selectedRosterCourseId) {
      setRoster([]);
      return;
    }

    setError(null);
    setMessage(null);
    setIsRosterLoading(true);

    try {
      const data = await fetchCourseStudents(selectedRosterCourseId);
      setRoster(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load course roster',
      );
      setRoster([]);
    } finally {
      setIsRosterLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-[0.3em] mb-2">
            VRT Management Command
          </p>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
            Admin Control Center
          </h1>
        </div>

        {isSaving && (
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl border border-nitrocrimson-50 animate-pulse">
            <i className="fas fa-circle-notch fa-spin text-nitrocrimson-600"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
              Syncing to backend...
            </span>
          </div>
        )}
      </header>

      {(message || error) && (
        <div
          className={`rounded-2xl p-4 font-bold text-sm ${
            error
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}
        >
          {error ?? message}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Create Course</h2>
          <p className="text-slate-400 text-sm font-medium mb-8">
            Add a new course. Then use Edit Course Content to add sections and lessons.
          </p>

          <form onSubmit={handleCreateCourse} className="space-y-5">
            <input
              required
              type="text"
              placeholder="Course title"
              value={courseForm.title}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
            />

            <textarea
              required
              placeholder="Course description"
              value={courseForm.description}
              onChange={(event) =>
                setCourseForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-medium h-36"
            />

            <input
              type="url"
              placeholder="Thumbnail URL (optional)"
              value={courseForm.thumbnailUrl}
              onChange={(event) =>
                setCourseForm((prev) => ({
                  ...prev,
                  thumbnailUrl: event.target.value,
                }))
              }
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={courseForm.price}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, price: event.target.value }))
              }
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
            />

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all"
            >
              Create Course
            </button>
          </form>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Allocate Course
          </h2>
          <p className="text-slate-400 text-sm font-medium mb-8">
            Assign an existing course to a student account.
          </p>

          <form onSubmit={handleAllocate} className="space-y-5">
            <select
              required
              value={allocationForm.courseId}
              onChange={(event) =>
                setAllocationForm((prev) => ({
                  ...prev,
                  courseId: event.target.value,
                }))
              }
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              required
              value={allocationForm.studentId}
              onChange={(event) =>
                setAllocationForm((prev) => ({
                  ...prev,
                  studentId: event.target.value,
                }))
              }
              className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all"
            >
              Allocate
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">
              Available students
            </h3>
            {students.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">
                No students found. Register students from the auth page first.
              </p>
            ) : (
              <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                  >
                    <p className="text-sm font-black text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Edit Course Content</h2>
        <p className="text-slate-400 text-sm font-medium mb-8">
          Add and edit course curriculum with sections and video lessons.
        </p>

        <form onSubmit={handleUpdateCourse} className="space-y-6">
          <select
            required
            value={selectedEditCourseId}
            onChange={(event) => setSelectedEditCourseId(event.target.value)}
            className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
          >
            <option value="">Select course to edit</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          {!selectedEditCourseId ? (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-sm text-slate-500 font-medium">
              Select a course to load editable fields and curriculum.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Course title"
                  value={editCourseForm.title}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
                />

                <input
                  type="url"
                  placeholder="Thumbnail URL (optional)"
                  value={editCourseForm.thumbnailUrl}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({
                      ...prev,
                      thumbnailUrl: event.target.value,
                    }))
                  }
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
                />

                <textarea
                  required
                  placeholder="Course description"
                  value={editCourseForm.description}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="lg:col-span-2 w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-medium h-32"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={editCourseForm.price}
                  onChange={(event) =>
                    setEditCourseForm((prev) => ({ ...prev, price: event.target.value }))
                  }
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
                />

                <div className="flex items-center rounded-2xl bg-slate-50 px-5 border border-slate-100">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    {selectedEditCourseTitle} • {editCourseForm.sections.length} sections •{' '}
                    {getLessonCount(toPayloadSections(editCourseForm.sections))} lessons
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
                    Curriculum Builder
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all"
                  >
                    Add Section
                  </button>
                </div>

                {editCourseForm.sections.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-sm text-slate-500 font-medium">
                    No sections yet. Add a section, then add subsections with video URLs.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editCourseForm.sections.map((section, sectionIndex) => (
                      <div
                        key={`section-${sectionIndex}`}
                        className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Section {sectionIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(sectionIndex)}
                            className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                          >
                            Remove Section
                          </button>
                        </div>

                        <input
                          required
                          type="text"
                          placeholder="Section title"
                          value={section.title}
                          onChange={(event) =>
                            handleSectionChange(sectionIndex, 'title', event.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
                        />

                        <textarea
                          placeholder="Section description (optional)"
                          value={section.description}
                          onChange={(event) =>
                            handleSectionChange(
                              sectionIndex,
                              'description',
                              event.target.value,
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-medium h-24"
                        />

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Subsections
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAddSubsection(sectionIndex)}
                              className="px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-nitrocrimson-500 hover:text-nitrocrimson-600 transition-all"
                            >
                              Add Subsection
                            </button>
                          </div>

                          {section.subsections.length === 0 ? (
                            <p className="text-sm text-slate-400 font-medium">
                              No subsections yet.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {section.subsections.map((subsection, subsectionIndex) => (
                                <div
                                  key={`subsection-${sectionIndex}-${subsectionIndex}`}
                                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      Subsection {subsectionIndex + 1}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveSubsection(
                                          sectionIndex,
                                          subsectionIndex,
                                        )
                                      }
                                      className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  <input
                                    required
                                    type="text"
                                    placeholder="Lesson title"
                                    value={subsection.title}
                                    onChange={(event) =>
                                      handleSubsectionChange(
                                        sectionIndex,
                                        subsectionIndex,
                                        'title',
                                        event.target.value,
                                      )
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
                                  />

                                  <input
                                    required
                                    type="url"
                                    placeholder="Video URL (required)"
                                    value={subsection.videoUrl}
                                    onChange={(event) =>
                                      handleSubsectionChange(
                                        sectionIndex,
                                        subsectionIndex,
                                        'videoUrl',
                                        event.target.value,
                                      )
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
                                  />

                                  <textarea
                                    placeholder="Lesson description (optional)"
                                    value={subsection.description}
                                    onChange={(event) =>
                                      handleSubsectionChange(
                                        sectionIndex,
                                        subsectionIndex,
                                        'description',
                                        event.target.value,
                                      )
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-medium h-20"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all"
              >
                Save Course Content
              </button>
            </>
          )}
        </form>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Course Roster</h2>
          <p className="text-slate-400 text-sm font-medium mb-8">
            View students allocated to a specific course.
          </p>

          <div className="flex gap-3">
            <select
              value={selectedRosterCourseId}
              onChange={(event) => setSelectedRosterCourseId(event.target.value)}
              className="flex-1 bg-slate-50 border-0 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-nitrocrimson-600 outline-none font-bold"
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
              disabled={!selectedRosterCourseId || isRosterLoading}
              className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all disabled:opacity-40"
            >
              {isRosterLoading ? 'Loading...' : 'Load'}
            </button>
          </div>

          <div className="mt-8">
            {selectedRosterCourseId && (
              <p className="text-sm text-slate-600 font-bold mb-4">
                Course: <span className="text-slate-900">{selectedCourseTitle}</span>
              </p>
            )}

            {roster.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">
                No students allocated yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {roster.map((entry) => (
                  <div
                    key={entry.enrollmentId}
                    className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"
                  >
                    <p className="text-sm font-black text-slate-800">
                      {entry.student.name}
                    </p>
                    <p className="text-xs text-slate-500">{entry.student.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-black text-slate-900 mb-2">All Courses</h2>
          <p className="text-slate-400 text-sm font-medium mb-8">
            Quick inventory of created courses.
          </p>

          {courses.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium">No courses yet.</p>
          ) : (
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-900 truncate">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {course.description}
                      </p>
                      <p className="text-[10px] mt-2 font-black uppercase tracking-widest text-nitrocrimson-600">
                        {course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}
                      </p>
                      <p className="text-[10px] mt-2 font-black uppercase tracking-widest text-slate-500">
                        {course.sections.length} sections • {getLessonCount(course.sections)} lessons
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEditCourseId(course.id)}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-nitrocrimson-600 transition-all"
                  >
                    Edit Content
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
