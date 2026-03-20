import React, { useEffect, useState } from 'react';
import { useLMS } from '../store';

const Profile: React.FC = () => {
  const {
    currentUser,
    courses,
    isSaving,
    updateProfilePicture,
    changePassword,
  } = useLMS();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(currentUser?.avatar ?? '');
  }, [currentUser?.avatar]);

  if (!currentUser) {
    return null;
  }

  const handleSaveProfilePicture = async (event: React.FormEvent) => {
    event.preventDefault();
    setAvatarError(null);
    setAvatarNotice(null);

    const trimmed = avatarUrl.trim();

    if (!trimmed) {
      setAvatarError('Profile picture URL is required.');
      return;
    }

    const result = await updateProfilePicture(trimmed);

    if (!result.success) {
      setAvatarError(result.message ?? 'Unable to update profile picture');
      return;
    }

    setAvatarNotice('Profile picture updated successfully.');
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password must match.');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (!result.success) {
      setPasswordError(result.message ?? 'Unable to change password');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordNotice(result.message ?? 'Password updated successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto pt-10 space-y-8 animate-fadeIn">
      <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-nitrocrimson-600"></div>
        <img
          src={currentUser.avatar}
          className="w-36 h-36 rounded-[2rem] mx-auto mb-8 border-4 border-white shadow-xl object-cover"
          alt=""
        />
        <h2 className="text-4xl font-black text-slate-900">{currentUser.name}</h2>
        <p className="text-slate-400 font-bold mt-2">{currentUser.email}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 border-t border-slate-50 pt-10">
          <div className="text-center bg-slate-50 p-6 rounded-[2rem]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Role
            </p>
            <span className="text-nitrocrimson-600 font-black uppercase">
              {currentUser.role}
            </span>
          </div>
          <div className="text-center bg-slate-50 p-6 rounded-[2rem]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Accessible Courses
            </p>
            <span className="text-slate-900 font-black">{courses.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100">
        <h3 className="text-2xl font-black text-slate-900 mb-2">Profile Picture</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Add an image URL and save to update your account picture.
        </p>

        {(avatarError || avatarNotice) && (
          <div
            className={`mb-5 rounded-2xl p-4 text-sm font-bold ${
              avatarError
                ? 'bg-red-50 border border-red-100 text-red-600'
                : 'bg-green-50 border border-green-100 text-green-700'
            }`}
          >
            {avatarError ?? avatarNotice}
          </div>
        )}

        <form onSubmit={handleSaveProfilePicture} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              required
              placeholder="https://example.com/my-photo.jpg"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
            <img
              src={avatarUrl.trim() || currentUser.avatar}
              alt="Profile preview"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200"
            />
            <p className="text-xs text-slate-500 font-medium">
              Preview updates while you type.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Profile Picture'}
          </button>
        </form>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100">
        <h3 className="text-2xl font-black text-slate-900 mb-2">Change Password</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Use a strong password that you do not reuse on other sites.
        </p>

        {(passwordError || passwordNotice) && (
          <div
            className={`mb-5 rounded-2xl p-4 text-sm font-bold ${
              passwordError
                ? 'bg-red-50 border border-red-100 text-red-600'
                : 'bg-green-50 border border-green-100 text-green-700'
            }`}
          >
            {passwordError ?? passwordNotice}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              minLength={8}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-nitrocrimson-500/40"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-nitrocrimson-600 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
