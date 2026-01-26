import type { CSSProperties } from 'react'

export const page: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

export const card: CSSProperties = {
  width: 420,
  padding: '48px 36px',
  borderRadius: 22,
  background: 'linear-gradient(180deg, #0f172a, #020617)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  color: '#ffffff'
}

export const header: CSSProperties = {
  textAlign: 'center',
  marginBottom: 36
}

export const logoStyle: CSSProperties = {
  width: 120,
  marginBottom: 16,
  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
}

export const title: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: 1
}

export const subtitle: CSSProperties = {
  fontSize: 13,
  color: '#22c55e',
  letterSpacing: 0.4
}

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 6,
  opacity: 0.85
}

export const inputStyle: CSSProperties = {
  width: '80%',
  display: 'block',
  padding: '14px 16px',
  margin: '0 auto 18px',
  borderRadius: 14,
  border: '1px solid #1e293b',
  background: '#020617',
  color: '#ffffff',
  fontSize: 14,
  outline: 'none'
}

export const buttonStyle: CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: 14,
  border: 'none',
  background: '#1d4ed8',
  color: '#ffffff',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(29,78,216,0.4)'
}

export const linkButton: CSSProperties = {
  marginTop: 20,
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#60a5fa',
  fontSize: 12,
  cursor: 'pointer'
}

export const errorStyle: CSSProperties = {
  color: '#fecaca',
  fontSize: 12,
  marginBottom: 12
}

export const successStyle: CSSProperties = {
  color: '#bbf7d0',
  fontSize: 12,
  marginBottom: 12
}
