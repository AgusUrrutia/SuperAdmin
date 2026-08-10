// El back devuelve las fechas como "YYYY-MM-DD HH:mm:ss[.fffffff]" (formato datetime2 de SQL Server),
// que el parser nativo de Date no siempre interpreta bien. Se normaliza a ISO truncando a milisegundos.
export function parseFechaLog(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  const normalizado = dateStr.replace(' ', 'T').substring(0, 23);
  return new Date(normalizado);
}

export function formatFechaLog(dateStr: string): string {
  if (!dateStr) return '--';
  const fecha = parseFechaLog(dateStr);
  return isNaN(fecha.getTime()) ? dateStr : fecha.toLocaleString();
}
