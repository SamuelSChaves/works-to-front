import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  consumePostLoginRedirect,
  login,
  requestPasswordReset
} from '../services/auth'
import logo from '../assets/ToWorks.png'
import {
  buttonStyle,
  card,
  errorStyle,
  header,
  inputStyle,
  labelStyle,
  linkButton,
  logoStyle,
  page,
  subtitle,
  successStyle,
  title
} from './authStyles'

export function Login() {
  const navigate = useNavigate()

  const [cs, setCs] = useState('')
  const [senha, setSenha] = useState('')
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!/^[0-9]{6}$/.test(cs)) {
      setError('Informe o CS com 6 dígitos')
      setSuccessMessage(null)
      return
    }

    if (modoRecuperar) {
      setError(null)
      setSuccessMessage(null)
      try {
        setIsLoading(true)
        await requestPasswordReset(cs)
        setSuccessMessage(
          'Enviamos um link de redefinição para o email cadastrado. Ele expira em alguns minutos.'
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível enviar o link de recuperação.'
        )
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!senha) {
      setError('Informe a senha')
      setSuccessMessage(null)
      return
    }

    setError(null)
    setSuccessMessage(null)
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

          {!modoRecuperar && (
            <>
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

          {error && <div style={errorStyle}>⚠ {error}</div>}
          {successMessage && <div style={successStyle}>{successMessage}</div>}

          {modoRecuperar && (
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
              Informe o usuário (CS) antes de enviar o link.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (modoRecuperar && !/^[0-9]{6}$/.test(cs))}
            style={buttonStyle}
          >
            {modoRecuperar
              ? isLoading
                ? 'Enviando...'
                : 'Enviar link'
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
            setSuccessMessage(null)
          }}
          style={linkButton}
        >
          {modoRecuperar ? 'Voltar para login' : 'Recuperar senha'}
        </button>
      </div>
    </div>
  )
}
