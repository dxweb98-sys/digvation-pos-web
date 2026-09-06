export interface BackofficeApiError {
  status: number | null;
  code: string;
  safeMessage: string;
}

const safeMessages: Record<string, string> = {
  NOT_FOUND: 'Data yang diminta tidak ditemukan.',
  VERSION_CONFLICT: 'Data telah berubah. Muat ulang lalu coba lagi.',
  DUPLICATE_RESOURCE: 'Data dengan nilai tersebut sudah digunakan.',
  INACTIVE_REFERENCE: 'Data referensi yang dipilih sudah tidak aktif.',
  DOMAIN_VALIDATION_ERROR: 'Data yang dimasukkan tidak valid.',
  SERVICE_UNAVAILABLE: 'Layanan sedang tidak tersedia. Coba beberapa saat lagi.',
  PRICE_AMOUNT_INVALID: 'Harga yang dimasukkan tidak valid.',
  PRICE_EFFECTIVE_TIME_INVALID: 'Waktu mulai harga tidak valid.',
  PRICE_EFFECTIVE_PERIOD_INVALID: 'Periode harga tidak valid.',
  EFFECTIVE_PERIOD_OVERLAP: 'Jadwal harga bertabrakan dengan harga lain.',
  PRICE_CHANGE_CONFLICT: 'Harga telah berubah. Muat ulang lalu coba lagi.',
  ITEM_ARCHIVED: 'Item yang diarsipkan tidak dapat diubah harganya.',
};

export function normalizeBackofficeApiError(
  error: unknown,
  fallback = 'Terjadi kesalahan. Silakan coba lagi.',
): BackofficeApiError {
  const value = error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
  const status = typeof value.status === 'number' ? value.status : null;
  const code = typeof value.code === 'string' ? value.code : 'UNKNOWN_API_ERROR';
  return { status, code, safeMessage: safeMessages[code] ?? fallback };
}

export function isBackofficeSessionExpired(error: unknown): boolean {
  return normalizeBackofficeApiError(error).status === 401;
}
