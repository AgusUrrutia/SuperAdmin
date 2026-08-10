export interface LogError {
  id: string;
  status_code: string;
  message: string;
  file_path: string;
  line_number: string;
  called_function: string;
  request_uri: string;
  created_at: string;
  aplicacion: string;
  // El back todavía no manda "usuario" en /super-admin/logs (confirmado 16/7). Se deja opcional
  // para no romper el modelo el día que lo sumen, pero no hay filtro/columna que dependa de esto por ahora.
  usuario?: string;
}

export interface LogErrorFiltros {
  buscar?: string;
  desde?: string;
  hasta?: string;
  codigo?: string;
}

export interface LogAcceso {
  timestamp: string;
  ip: string;
  metodo: string;
  uri: string;
  aplicacion: string;
  usuario: string;
  userAgent: string;
  body: any;
}

export interface LogAccesoFiltros {
  uri?: string;
  metodo?: string;
  usuario?: string;
}
