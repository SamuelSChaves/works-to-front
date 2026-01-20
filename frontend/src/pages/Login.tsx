import { useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumePostLoginRedirect, login } from '../services/auth'
import logo from '../assets/ToWorks.png'

export function Login() {
  const navigate = useNavigate()

  const [cs, setCs] = useState('')
  const [senha, setSenha] = useState('')
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!modoRecuperar && !/^[0-9]{6}$/.test(cs)) {
      setError('Informe o CS com 6 dígitos')
      return
    }

    if (!modoRecuperar && !senha) {
      setError('Informe a senha')
      return
    }

    setError(null)

    if (modoRecuperar) {
      alert('Fluxo de recuperação será implementado.')
      return
    }

    try {
      setIsLoading(true)
      await login(cs, senha)
      const redirect = consumePostLoginRedirect()
      navigate(redirect || '/app')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar. Verifique seu CS e senha.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={page}>
      <div style={card}>
        {/* LOGO */}
        <div style={header}>
          <img src={logo} alt="TO Works" style={logoStyle} />

          <h1 style={title}>TO Works</h1>

          <span style={subtitle}>Tecnologia Operacional</span>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {!modoRecuperar && (
            <>
              <label style={labelStyle}>Usuário</label>
              <input
                type="text"
                value={cs}
                onChange={e =>
                  setCs(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder=""
                inputMode="numeric"
                style={inputStyle}
              />

              <label style={labelStyle}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder=""
                style={inputStyle}
              />
            </>
          )}

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <button type="submit" disabled={isLoading} style={buttonStyle}>
            {modoRecuperar
              ? 'Enviar código'
              : isLoading
              ? 'Entrando...'
              : 'Acessar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModoRecuperar(!modoRecuperar)
            setError(null)
          }}
          style={linkButton}
        >
          {modoRecuperar ? 'Voltar para login' : 'Recuperar senha'}
        </button>
      </div>
    </div>
  )
}

/* ===================== */
/* 🎨 STYLES */
/* ===================== */

const page: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const card: CSSProperties = {
  width: 420,
  padding: '48px 36px',
  borderRadius: 22,
  background: 'linear-gradient(180deg, #0f172a, #020617)',
  boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  color: '#ffffff'
}

const header: CSSProperties = {
  textAlign: 'center',
  marginBottom: 36
}

const logoStyle: CSSProperties = {
  width: 120,
  marginBottom: 16,
  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
}

const title: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: 1
}

const subtitle: CSSProperties = {
  fontSize: 13,
  color: '#22c55e',
  letterSpacing: 0.4
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 6,
  opacity: 0.85
}

const inputStyle: CSSProperties = {
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

const buttonStyle: CSSProperties = {
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

const linkButton: CSSProperties = {
  marginTop: 20,
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#60a5fa',
  fontSize: 12,
  cursor: 'pointer'
}

const errorStyle: CSSProperties = {
  color: '#fecaca',
  fontSize: 12,
  marginBottom: 12
}
