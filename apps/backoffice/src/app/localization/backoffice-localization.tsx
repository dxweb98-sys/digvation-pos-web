import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type BackofficeLocale = 'id' | 'en';

const storageKey = 'digvation.pos.backoffice.locale.v1';

const messages = {
  id: {
    dashboard: 'Dasbor', masterData: 'Data Master', catalog: 'Katalog', employees: 'Karyawan',
    finance: 'Keuangan', financialAccounts: 'Akun Keuangan', expenses: 'Pengeluaran', reconciliation: 'Rekonsiliasi',
    reporting: 'Pelaporan', reports: 'Laporan', configuration: 'Konfigurasi', business: 'Bisnis', tax: 'Pajak',
    accessControl: 'Kontrol Akses', logout: 'Keluar', profile: 'Profil', changePassword: 'Ubah kata sandi',
    language: 'Bahasa', indonesian: 'Bahasa Indonesia', english: 'English', online: 'Online',
    authenticatedUser: 'Pengguna terautentikasi', openNavigation: 'Buka menu navigasi', notifications: 'Notifikasi',
    openAccountMenu: 'Buka menu akun', userAccount: 'Akun pengguna',
    signIn: 'Masuk', signInToBackoffice: 'Masuk ke Backoffice', usernameOrPhone: 'Nama pengguna atau nomor telepon',
    password: 'Kata sandi', signInFailed: 'Masuk gagal. Periksa kredensial ruang kerja Anda lalu coba lagi.',
    sessionExpired: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    startupBlocked: 'Memulai aplikasi diblokir', startupFailed: 'Backoffice tidak dapat dimulai.', unknownStartupError: 'Kesalahan awal tidak diketahui',
    overview: 'Ringkasan', workspaceReady: 'Ruang kerja Backoffice Anda siap.',
    accessUnavailable: 'Akses tidak tersedia', accessUnavailableDescription: 'Peran Anda saat ini tidak memberikan akses ke area ini.', goToDashboard: 'Ke dasbor',
    notAvailableYet: 'Belum tersedia', notAvailableDescription: 'Area ini akan tersedia ketika kemampuan Backoffice terkait telah disediakan.',
    taxDescription: 'Pengaturan pajak akan tersedia di sini.', accountAndRuntime: 'Akun & runtime', version: 'Versi', build: 'Build',
  },
  en: {
    dashboard: 'Dashboard', masterData: 'Master Data', catalog: 'Catalog', employees: 'Employees',
    finance: 'Finance', financialAccounts: 'Financial Accounts', expenses: 'Expenses', reconciliation: 'Reconciliation',
    reporting: 'Reporting', reports: 'Reports', configuration: 'Configuration', business: 'Business', tax: 'Tax',
    accessControl: 'Access Control', logout: 'Logout', profile: 'Profile', changePassword: 'Change Password',
    language: 'Language', indonesian: 'Bahasa Indonesia', english: 'English', online: 'Online',
    authenticatedUser: 'Authenticated user', openNavigation: 'Open navigation menu', notifications: 'Notifications',
    openAccountMenu: 'Open account menu', userAccount: 'User account',
    signIn: 'Sign in', signInToBackoffice: 'Sign in to Backoffice', usernameOrPhone: 'Username or phone',
    password: 'Password', signInFailed: 'Sign-in failed. Check your workspace credentials and try again.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    startupBlocked: 'Startup blocked', startupFailed: 'Backoffice could not initialize.', unknownStartupError: 'Unknown startup error',
    overview: 'Overview', workspaceReady: 'Your Backoffice workspace is ready.',
    accessUnavailable: 'Access unavailable', accessUnavailableDescription: 'Your current role does not grant access to this area.', goToDashboard: 'Go to dashboard',
    notAvailableYet: 'Not available yet', notAvailableDescription: 'This area will be available when its dedicated Backoffice capability is delivered.',
    taxDescription: 'Tax settings will be available here.', accountAndRuntime: 'Account & runtime', version: 'Version', build: 'Build',
  },
} as const;

const copy: Record<string, { id: string; en: string }> = {
  'Business profile': { id: 'Profil bisnis', en: 'Business profile' },
  'Configuration': { id: 'Konfigurasi', en: 'Configuration' },
  'Selling locations': { id: 'Lokasi penjualan', en: 'Selling locations' },
  'Edit profile': { id: 'Ubah profil', en: 'Edit profile' },
  'Not configured': { id: 'Belum dikonfigurasi', en: 'Not configured' },
  'Add location': { id: 'Tambah lokasi', en: 'Add location' },
  'No selling locations have been created yet.': { id: 'Belum ada lokasi penjualan yang dibuat.', en: 'No selling locations have been created yet.' },
  'Active': { id: 'Aktif', en: 'Active' }, 'Inactive': { id: 'Nonaktif', en: 'Inactive' },
  'Cancel': { id: 'Batal', en: 'Cancel' }, 'Save': { id: 'Simpan', en: 'Save' },
  'Previous': { id: 'Sebelumnya', en: 'Previous' }, 'Next': { id: 'Berikutnya', en: 'Next' },
  'Add selling location': { id: 'Tambah lokasi penjualan', en: 'Add selling location' },
  'Edit selling location': { id: 'Ubah lokasi penjualan', en: 'Edit selling location' },
  'Save location': { id: 'Simpan lokasi', en: 'Save location' },
  'Location code': { id: 'Kode lokasi', en: 'Location code' }, 'Location name': { id: 'Nama lokasi', en: 'Location name' },
  'Deactivate selling location?': { id: 'Nonaktifkan lokasi penjualan?', en: 'Deactivate selling location?' },
  'Deactivate': { id: 'Nonaktifkan', en: 'Deactivate' },
  'Access Control': { id: 'Kontrol Akses', en: 'Access Control' }, 'Create role': { id: 'Tambah peran', en: 'Create role' },
  'Roles': { id: 'Peran', en: 'Roles' }, 'Users': { id: 'Pengguna', en: 'Users' },
  'Role': { id: 'Peran', en: 'Role' }, 'Permissions': { id: 'Izin', en: 'Permissions' },
  'Status': { id: 'Status', en: 'Status' }, 'Code': { id: 'Kode', en: 'Code' }, 'Name': { id: 'Nama', en: 'Name' },
  'Manage role': { id: 'Kelola peran', en: 'Manage role' }, 'Manage roles': { id: 'Kelola peran', en: 'Manage roles' },
  'Deactivate role': { id: 'Nonaktifkan peran', en: 'Deactivate role' }, 'Deactivate role?': { id: 'Nonaktifkan peran?', en: 'Deactivate role?' },
  'Role code': { id: 'Kode peran', en: 'Role code' }, 'Role name': { id: 'Nama peran', en: 'Role name' },
  'Save role': { id: 'Simpan peran', en: 'Save role' }, 'Manage user roles': { id: 'Kelola peran pengguna', en: 'Manage user roles' },
  'Save assignments': { id: 'Simpan penetapan', en: 'Save assignments' }, 'Protected': { id: 'Dilindungi', en: 'Protected' },
  'Catalog': { id: 'Katalog', en: 'Catalog' }, 'Items': { id: 'Item', en: 'Items' }, 'Categories': { id: 'Kategori', en: 'Categories' },
  'Item': { id: 'Item', en: 'Item' }, 'Type': { id: 'Tipe', en: 'Type' }, 'Category': { id: 'Kategori', en: 'Category' },
  'Default Price': { id: 'Harga default', en: 'Default Price' }, 'Variants': { id: 'Varian', en: 'Variants' },
};

export type BackofficeMessageKey = keyof (typeof messages)['id'];

interface BackofficeLocalizationValue {
  locale: BackofficeLocale;
  setLocale: (locale: BackofficeLocale) => void;
  t: (key: BackofficeMessageKey) => string;
  copy: (value: string) => string;
  formatDate: (value: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatMoney: (amount: string, currency: string) => string;
}

const BackofficeLocalizationContext = createContext<BackofficeLocalizationValue | null>(null);

function readStoredLocale(): BackofficeLocale {
  if (typeof window === 'undefined') return 'id';
  return window.localStorage.getItem(storageKey) === 'en' ? 'en' : 'id';
}

export function BackofficeLocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setCurrentLocale] = useState<BackofficeLocale>(readStoredLocale);
  const setLocale = useCallback((nextLocale: BackofficeLocale) => {
    window.localStorage.setItem(storageKey, nextLocale);
    setCurrentLocale(nextLocale);
  }, []);
  const value = useMemo<BackofficeLocalizationValue>(() => ({
    locale,
    setLocale,
    t: (key) => messages[locale][key],
    copy: (value) => copy[value]?.[locale] ?? value,
    formatDate: (value, options) => new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', options).format(value),
    formatMoney: (amount, currency) => new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount)),
  }), [locale, setLocale]);
  return <BackofficeLocalizationContext.Provider value={value}>{children}</BackofficeLocalizationContext.Provider>;
}

export function useBackofficeLocalization(): BackofficeLocalizationValue {
  const context = useContext(BackofficeLocalizationContext);
  if (!context) throw new Error('BackofficeLocalizationProvider is missing.');
  return context;
}
