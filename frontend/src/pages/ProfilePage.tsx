import React, { useState } from 'react';
import { User, Lock, Mail, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    try {
      await api.put('/auth/me', { full_name: fullName });
      await refreshUser();
      setProfileMessage('Profile information successfully updated.');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-navy-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
          Account Profile & Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your credentials and personal authentication preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
          <h2 className="font-bold text-base text-navy-900 dark:text-white pb-3 border-b border-slate-100 dark:border-navy-800">
            Profile Details
          </h2>

          {profileMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{profileMessage}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-100 dark:bg-navy-950 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Role</label>
              <span className="px-2.5 py-1 rounded-md bg-gold-50 dark:bg-navy-950 text-gold-700 dark:text-gold-400 font-bold uppercase text-[11px] inline-block">
                {user?.role}
              </span>
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 font-bold shadow transition"
            >
              Save Profile
            </button>
          </form>
        </div>

        {/* Password Change Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-5">
          <h2 className="font-bold text-base text-navy-900 dark:text-white pb-3 border-b border-slate-100 dark:border-navy-800">
            Change Password
          </h2>

          {passwordMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white outline-none focus:border-gold-500"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-lg bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 font-bold shadow transition"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
