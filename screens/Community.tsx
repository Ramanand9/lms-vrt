import React, { useEffect, useMemo, useState } from 'react';
import { API, ApiError } from '../services/db';
import { useLMS } from '../store';
import {
  AdminInboxMessage,
  Announcement,
  StudentAdminMessage,
  UserRole,
} from '../types';

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
};

const Community: React.FC = () => {
  const { currentUser } = useLMS();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [studentMessages, setStudentMessages] = useState<StudentAdminMessage[]>(
    [],
  );
  const [adminInbox, setAdminInbox] = useState<AdminInboxMessage[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
  });
  const [studentMessageForm, setStudentMessageForm] = useState({
    subject: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] =
    useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const roleLabel = useMemo(() => {
    if (!currentUser) {
      return '';
    }

    return currentUser.role === UserRole.ADMIN ? 'admin' : 'student';
  }, [currentUser]);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const announcementFeed = await API.fetchAnnouncements();

        setAnnouncements(announcementFeed);

        if (isAdmin) {
          const inbox = await API.fetchAdminMessages();
          setAdminInbox(inbox);
          setStudentMessages([]);
        } else {
          const myMessages = await API.fetchMyAdminMessages();
          setStudentMessages(myMessages);
          setAdminInbox([]);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [currentUser, isAdmin]);

  const handlePostAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmittingAnnouncement(true);

    try {
      const created = await API.createAnnouncement({
        title: announcementForm.title,
        message: announcementForm.message,
      });

      setAnnouncements((prev) => [created, ...prev]);
      setAnnouncementForm({
        title: '',
        message: '',
      });
      setNotice('Announcement posted.');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmittingMessage(true);

    try {
      const created = await API.sendMessageToAdmin({
        subject: studentMessageForm.subject,
        message: studentMessageForm.message,
      });

      setStudentMessages((prev) => [created, ...prev]);
      setStudentMessageForm({
        subject: '',
        message: '',
      });
      setNotice('Message sent to admin.');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-10 animate-fadeIn pb-20">
      <header>
        <p className="text-[10px] font-black uppercase text-nitrocrimson-600 tracking-[0.3em] mb-2">
          Community
        </p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          Student and Admin Hub
        </h1>
      </header>

      {(error || notice) && (
        <div
          className={`rounded-2xl p-4 text-sm font-bold ${
            error
              ? 'bg-red-50 border border-red-100 text-red-600'
              : 'bg-green-50 border border-green-100 text-green-700'
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <section className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Account
            </p>
            <p className="text-lg font-black text-slate-900">{currentUser.name}</p>
            <p className="text-sm text-slate-500 mt-1">{currentUser.email}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Role
            </p>
            <p className="text-lg font-black text-slate-900 uppercase">
              {roleLabel}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {isAdmin
                ? 'Post announcements and review student inbox.'
                : 'Read announcements and message admin.'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Totals
            </p>
            <p className="text-lg font-black text-slate-900">
              {announcements.length} announcements
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {isAdmin
                ? `${adminInbox.length} student messages`
                : `${studentMessages.length} sent messages`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Announcements
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Latest updates from admins.
          </p>

          {isAdmin && (
            <form onSubmit={handlePostAnnouncement} className="space-y-4 mb-8">
              <input
                type="text"
                value={announcementForm.title}
                onChange={(event) =>
                  setAnnouncementForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                required
                minLength={2}
                maxLength={180}
                placeholder="Announcement title"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
              />
              <textarea
                value={announcementForm.message}
                onChange={(event) =>
                  setAnnouncementForm((prev) => ({
                    ...prev,
                    message: event.target.value,
                  }))
                }
                required
                minLength={1}
                maxLength={5000}
                rows={4}
                placeholder="Write announcement details"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-medium text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
              />
              <button
                type="submit"
                disabled={isSubmittingAnnouncement}
                className="px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
              >
                {isSubmittingAnnouncement ? 'Posting...' : 'Post Announcement'}
              </button>
            </form>
          )}

          {isLoading ? (
            <div className="text-sm font-bold text-slate-400">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-sm font-medium text-slate-500">
              No announcements yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                >
                  <h3 className="text-base font-black text-slate-900">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
                    {announcement.message}
                  </p>
                  <div className="mt-3 text-[11px] font-bold text-slate-400">
                    Posted by {announcement.postedBy.name} on{' '}
                    {formatDateTime(announcement.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-10 shadow-sm">
          {isAdmin ? (
            <>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Student Messages
              </h2>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Inbox of questions sent by students.
              </p>

              {isLoading ? (
                <div className="text-sm font-bold text-slate-400">
                  Loading inbox...
                </div>
              ) : adminInbox.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-sm font-medium text-slate-500">
                  No student messages yet.
                </div>
              ) : (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                  {adminInbox.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                    >
                      <h3 className="text-sm font-black text-slate-900">
                        {entry.subject}
                      </h3>
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
                        {entry.message}
                      </p>
                      <div className="mt-3 text-[11px] font-bold text-slate-400">
                        From {entry.student.name} ({entry.student.email}) on{' '}
                        {formatDateTime(entry.createdAt)}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Message Admin
              </h2>
              <p className="text-sm text-slate-500 font-medium mb-6">
                Send a question and track your sent messages.
              </p>

              <form onSubmit={handleSendMessage} className="space-y-4 mb-8">
                <input
                  type="text"
                  value={studentMessageForm.subject}
                  onChange={(event) =>
                    setStudentMessageForm((prev) => ({
                      ...prev,
                      subject: event.target.value,
                    }))
                  }
                  required
                  minLength={2}
                  maxLength={150}
                  placeholder="Subject"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
                />
                <textarea
                  value={studentMessageForm.message}
                  onChange={(event) =>
                    setStudentMessageForm((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                  required
                  minLength={1}
                  maxLength={5000}
                  rows={4}
                  placeholder="Write your message to admin"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-medium text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
                />
                <button
                  type="submit"
                  disabled={isSubmittingMessage}
                  className="px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
                >
                  {isSubmittingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </form>

              {isLoading ? (
                <div className="text-sm font-bold text-slate-400">
                  Loading sent messages...
                </div>
              ) : studentMessages.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-sm font-medium text-slate-500">
                  You have not sent any messages yet.
                </div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {studentMessages.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                    >
                      <h3 className="text-sm font-black text-slate-900">
                        {entry.subject}
                      </h3>
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
                        {entry.message}
                      </p>
                      <div className="mt-3 text-[11px] font-bold text-slate-400">
                        Sent on {formatDateTime(entry.createdAt)}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Community;
