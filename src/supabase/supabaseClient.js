import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nmqcmybqevigvvsgybed.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcWNteWJxZXZpZ3Z2c2d5YmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjk1NDMsImV4cCI6MjEwNjY0NTU0M30.PKI5aDx-lGk-nZE9eGaAY6SFgPRXQYaksEUI7y6JA3M'

// "Recordar mi sesión": si está activo la sesión vive en localStorage (sobrevive al cierre
// del navegador); si no, en sessionStorage (se borra al cerrar la pestaña/navegador).
const RECORDAR_KEY = 'stocky_recordar_sesion'

export const getRecordarSesion = () => {
  try {
    return localStorage.getItem(RECORDAR_KEY) !== 'false'
  } catch {
    return true
  }
}

export const setRecordarSesion = (recordar) => {
  try {
    localStorage.setItem(RECORDAR_KEY, recordar ? 'true' : 'false')
  } catch {
    // almacenamiento no disponible
  }
}

const authStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      const destino = getRecordarSesion() ? localStorage : sessionStorage
      const otro = destino === localStorage ? sessionStorage : localStorage
      destino.setItem(key, value)
      otro.removeItem(key)
    } catch {
      // almacenamiento no disponible
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      // almacenamiento no disponible
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})