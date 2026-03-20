import React, { useEffect, useMemo, useState } from 'react';
import { useLMS } from '../store';
import { CourseSection } from '../types';

type EditableMaterial = {
  title: string;
  url: string;
};

type EditableSubsection = {
  title: string;
  description: string;
  videoUrl: string;
  materials: EditableMaterial[];
};

type EditableSection = {
  title: string;
  description: string;
  subsections: EditableSubsection[];
};

const createEmptyMaterial = (): EditableMaterial => ({
  title: '',
  url: '',
});

const createEmptySubsection = (): EditableSubsection => ({
  title: '',
  description: '',
  videoUrl: '',
  materials: [],
});

const createEmptySection = (): EditableSection => ({
  title: '',
  description: '',
  subsections: [],
});

const createEmptyCourseForm = () => ({
  title: '',
  description: '',
  thumbnailUrl: '',
  price: '0',
  sections: [] as EditableSection[],
});

const toEditableSections = (sections: CourseSection[]): EditableSection[] =>
  sections.map((section) => ({
    title: section.title,
    description: section.description ?? '',
    subsections: section.subsections.map((subsection) => ({
      title: subsection.title,
      description: subsection.description ?? '',
      videoUrl: subsection.videoUrl,
      materials: (subsection.materials ?? []).map((material) => ({
        title: material.title,
        url: material.url,
      })),
    })),
  }));

const toPayloadSections = (sections: EditableSection[]): CourseSection[] =>
  sections.map((section) => ({
    title: section.title,
    description: section.description.trim() || undefined,
    subsections: section.subsections.map((subsection) => ({
      title: subsection.title,
      description: subsection.description.trim() || undefined,
      videoUrl: subsection.videoUrl,
      materials: subsection.materials
        .map((material) => ({
          title: material.title.trim(),
          url: material.url.trim(),
        }))
        .filter((material) => material.title.length > 0 && material.url.length > 0),
    })),
  }));

const getLessonCount = (sections: CourseSection[]): number =>
  sections.reduce((total, section) => total + section.subsections.length, 0);

const getEditableLessonCount = (sections: EditableSection[]): number =>
  sections.reduce((total, section) => total + section.subsections.length, 0);

const AdminCourses: React.FC = () => {
  const {
    courses,
    isSaving,
    createCourse,
    updateCourse,
    deleteCourse,
  } = useLMS();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseForm, setCourseForm] = useState(createEmptyCourseForm());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  useEffect(() => {
    if (!selectedCourseId) {
      setCourseForm(createEmptyCourseForm());
      return;
    }

    const course = courses.find((entry) => entry.id === selectedCourseId);

    if (!course) {
      setSelectedCourseId('');
      setCourseForm(createEmptyCourseForm());
      return;
    }

    setCourseForm({
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? '',
      price: course.price.toString(),
      sections: toEditableSections(course.sections),
    });
  }, [courses, selectedCourseId]);

  const handleSaveCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsedPrice = Number.parseFloat(courseForm.price);
    const payload = {
      title: courseForm.title,
      description: courseForm.description,
      thumbnailUrl: courseForm.thumbnailUrl || undefined,
      price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
      sections: toPayloadSections(courseForm.sections),
    };

    const result = selectedCourseId
      ? await updateCourse(selectedCourseId, payload)
      : await createCourse(payload);

    if (!result.success) {
      setError(
        result.message ??
          (selectedCourseId ? 'Unable to update course' : 'Unable to create course'),
      );
      return;
    }

    if (selectedCourseId) {
      setMessage('Course updated successfully.');
      return;
    }

    setCourseForm(createEmptyCourseForm());
    setMessage('Course created successfully.');
  };

  const handleDeleteSelectedCourse = async () => {
    if (!selectedCourse) {
      setError('Select a course to delete.');
      return;
    }

    setError(null);
    setMessage(null);

    const isConfirmed = window.confirm(
      `Delete "${selectedCourse.title}"?\n\nThis permanently removes the course and all allocations.`,
    );

    if (!isConfirmed) {
      return;
    }

    const result = await deleteCourse(selectedCourse.id);

    if (!result.success) {
      setError(result.message ?? 'Unable to delete course.');
      return;
    }

    setSelectedCourseId('');
    setCourseForm(createEmptyCourseForm());
    setMessage('Course deleted successfully.');
  };

  const handleAddSection = () => {
    setCourseForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection()],
    }));
  };

  const handleRemoveSection = (sectionIndex: number) => {
    setCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  const handleSectionChange = (
    sectionIndex: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    setCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, [field]: value } : section,
      ),
    }));
  };

  const handleAddSubsection = (sectionIndex: number) => {
    setCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? { ...section, subsections: [...section.subsections, createEmptySubsection()] }
          : section,
      ),
    }));
  };

  const handleRemoveSubsection = (sectionIndex: number, subsectionIndex: number) => {
    setCourseForm((prev) => ({
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
    setCourseForm((prev) => ({
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

  const handleAddMaterial = (sectionIndex: number, subsectionIndex: number) => {
    setCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subsections: section.subsections.map((subsection, subIndex) =>
                subIndex === subsectionIndex
                  ? {
                      ...subsection,
                      materials: [...subsection.materials, createEmptyMaterial()],
                    }
                  : subsection,
              ),
            }
          : section,
      ),
    }));
  };

  const handleRemoveMaterial = (
    sectionIndex: number,
    subsectionIndex: number,
    materialIndex: number,
  ) => {
    setCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subsections: section.subsections.map((subsection, subIndex) =>
                subIndex === subsectionIndex
                  ? {
                      ...subsection,
                      materials: subsection.materials.filter(
                        (_, matIndex) => matIndex !== materialIndex,
                      ),
                    }
                  : subsection,
              ),
            }
          : section,
      ),
    }));
  };

  const handleMaterialChange = (
    sectionIndex: number,
    subsectionIndex: number,
    materialIndex: number,
    field: 'title' | 'url',
    value: string,
  ) => {
    setCourseForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              subsections: section.subsections.map((subsection, subIndex) =>
                subIndex === subsectionIndex
                  ? {
                      ...subsection,
                      materials: subsection.materials.map((material, matIndex) =>
                        matIndex === materialIndex
                          ? { ...material, [field]: value }
                          : material,
                      ),
                    }
                  : subsection,
              ),
            }
          : section,
      ),
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-20">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Admin Courses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, edit, and delete course content.
          </p>
        </div>
        {isSaving && (
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
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
            >
              <option value="">+ Create New Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <button
              type="button"
              onClick={handleDeleteSelectedCourse}
              disabled={isSaving}
              className="px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-50"
            >
              Delete Course
            </button>
          )}
        </div>

        <form onSubmit={handleSaveCourse} className="space-y-4">
          <input
            required
            type="text"
            placeholder="Course title"
            value={courseForm.title}
            onChange={(event) =>
              setCourseForm((prev) => ({ ...prev, title: event.target.value }))
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
          />

          <textarea
            required
            placeholder="Course description"
            value={courseForm.description}
            onChange={(event) =>
              setCourseForm((prev) => ({ ...prev, description: event.target.value }))
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-medium h-28"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="url"
              placeholder="Thumbnail URL (optional)"
              value={courseForm.thumbnailUrl}
              onChange={(event) =>
                setCourseForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-600">
            Sections: {courseForm.sections.length} | Lessons: {getEditableLessonCount(courseForm.sections)}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-800">Curriculum</p>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
              >
                Add Section
              </button>
            </div>

            {courseForm.sections.length === 0 ? (
              <p className="text-sm text-slate-500">No sections added yet.</p>
            ) : (
              <div className="space-y-3">
                {courseForm.sections.map((section, sectionIndex) => (
                  <div
                    key={`section-${sectionIndex}`}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-700">
                        Section {sectionIndex + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sectionIndex)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-600"
                      >
                        Remove
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold"
                    />

                    <textarea
                      placeholder="Section description (optional)"
                      value={section.description}
                      onChange={(event) =>
                        handleSectionChange(sectionIndex, 'description', event.target.value)
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-medium h-20"
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-700">Lessons</p>
                        <button
                          type="button"
                          onClick={() => handleAddSubsection(sectionIndex)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                          Add Lesson
                        </button>
                      </div>

                      {section.subsections.length === 0 ? (
                        <p className="text-xs text-slate-500">No lessons added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {section.subsections.map((subsection, subsectionIndex) => (
                            <div
                              key={`subsection-${sectionIndex}-${subsectionIndex}`}
                              className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-black text-slate-700">
                                  Lesson {subsectionIndex + 1}
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSubsection(sectionIndex, subsectionIndex)
                                  }
                                  className="text-[10px] font-black uppercase tracking-widest text-red-600"
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold"
                              />

                              <input
                                required
                                type="url"
                                placeholder="Video URL"
                                value={subsection.videoUrl}
                                onChange={(event) =>
                                  handleSubsectionChange(
                                    sectionIndex,
                                    subsectionIndex,
                                    'videoUrl',
                                    event.target.value,
                                  )
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold"
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-medium h-16"
                              />

                              <div className="space-y-2 border-t border-slate-100 pt-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-black text-slate-700">
                                    PDF and Docs
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddMaterial(sectionIndex, subsectionIndex)
                                    }
                                    className="px-2.5 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                  >
                                    Add Doc
                                  </button>
                                </div>

                                {subsection.materials.length === 0 ? (
                                  <p className="text-xs text-slate-500">No docs attached.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {subsection.materials.map((material, materialIndex) => (
                                      <div
                                        key={`material-${sectionIndex}-${subsectionIndex}-${materialIndex}`}
                                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <p className="text-[10px] font-black text-slate-600">
                                            Doc {materialIndex + 1}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveMaterial(
                                                sectionIndex,
                                                subsectionIndex,
                                                materialIndex,
                                              )
                                            }
                                            className="text-[10px] font-black uppercase tracking-widest text-red-600"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                        <input
                                          required
                                          type="text"
                                          placeholder="Document title"
                                          value={material.title}
                                          onChange={(event) =>
                                            handleMaterialChange(
                                              sectionIndex,
                                              subsectionIndex,
                                              materialIndex,
                                              'title',
                                              event.target.value,
                                            )
                                          }
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold text-sm"
                                        />
                                        <input
                                          required
                                          type="url"
                                          placeholder="Document URL"
                                          value={material.url}
                                          onChange={(event) =>
                                            handleMaterialChange(
                                              sectionIndex,
                                              subsectionIndex,
                                              materialIndex,
                                              'url',
                                              event.target.value,
                                            )
                                          }
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold text-sm"
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
          >
            {selectedCourseId ? 'Save Course Changes' : 'Create Course'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-black text-slate-900 mb-3">Course List</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-slate-500">No courses created yet.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{course.title}</p>
                  <p className="text-xs text-slate-500">
                    {course.sections.length} sections | {getLessonCount(course.sections)} lessons
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminCourses;
