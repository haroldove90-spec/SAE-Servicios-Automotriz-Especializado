/**
 * Utilidades automáticas para manejo homogéneo de fechas y horas en formato oficial SAE (México: DD/MM/AAAA).
 */

export const getTodayIsoDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDisplayDate = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getCurrentTime = (): string => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Normaliza cualquier formato de fecha a formato visible oficial DD/MM/AAAA (para documentos PDF y visualización).
 */
export const formatDateToDisplay = (dateStr?: string | null): string => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return getTodayDisplayDate();
  }

  const clean = dateStr.trim();

  // If already DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // If DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // If ISO YYYY-MM-DD or contains time (YYYY-MM-DDTHH... or YYYY-MM-DD HH...)
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const isoPart = clean.substring(0, 10);
    const [y, m, d] = isoPart.split('-');
    return `${d}/${m}/${y}`;
  }

  // Fallback try Date parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return clean;
};

/**
 * Normaliza cualquier formato de fecha a formato ISO YYYY-MM-DD requerido por <input type="date"> de HTML5.
 */
export const formatDateToIso = (dateStr?: string | null): string => {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return getTodayIsoDate();
  }

  const clean = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // If contains time YYYY-MM-DD...
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.substring(0, 10);
  }

  // If DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // If DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return getTodayIsoDate();
};
