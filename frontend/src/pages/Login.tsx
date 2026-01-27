import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  consumePostLoginRedirect,
  confirmSecurityCode,
  login,
  requestPasswordReset,
  resendSecurityCode,
  SecurityValidationError,
  SecurityValidationInfo
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
  const [securityChallenge, setSecurityChallenge] =
    useState<SecurityValidationInfo | null>(null)
  const [securityCode, setSecurityCode] = useState('')
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [isSecurityLoading, setIsSecurityLoading] = useState(false)

  const isSecurityValidationError = (
    value: unknown
  ): value is SecurityValidationError =>
    typeof value === 'object' &&
    value !== null &&
    'securityValidation' in value &&
    Boolean((value as SecurityValidationError).securityValidation)

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
      setSecurityChallenge(null)
      setSecurityCode('')
      setSecurityError(null)
      await login(cs, senha)
      const redirect = consumePostLoginRedirect()
      navigate(redirect || '/app')
    } catch (err) {
      if (isSecurityValidationError(err) && err.securityValidation) {
        const info = err.securityValidation
        setSecurityChallenge(info)
        setSecurityCode('')
        setSecurityError(null)
        setSuccessMessage(
          `Enviamos um código de segurança para ${
            info.email_hint ?? 'seu email cadastrado'
          }.`
        )
        return
      }
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar. Verifique seu CS e senha.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSecurityConfirm() {
    if (!securityChallenge) return
    if (!/^[0-9]{6}$/.test(securityCode)) {
      setSecurityError('Informe o código com 6 dígitos')
      return
    }
    setSecurityError(null)
    try {
      setIsSecurityLoading(true)
      await confirmSecurityCode(securityChallenge.challenge_id, securityCode)
      const redirect = consumePostLoginRedirect()
      navigate(redirect || '/app')
    } catch (err) {
      setSecurityError(
        err instanceof Error
          ? err.message
          : 'Não foi possível confirmar o código.'
      )
    } finally {
      setIsSecurityLoading(false)
    }
  }

  async function handleSecurityResend() {
    if (!securityChallenge) return
    setSecurityError(null)
    try {
      setIsSecurityLoading(true)
      const nextChallenge = await resendSecurityCode(securityChallenge.challenge_id)
      if (nextChallenge) {
        setSecurityChallenge(nextChallenge)
        setSecurityCode('')
        setSuccessMessage(
          `Enviamos o código novamente para ${
            nextChallenge.email_hint ?? 'seu email cadastrado'
          }.`
        )
      }
    } catch (err) {
      setSecurityError(
        err instanceof Error
          ? err.message
          : 'Não foi possível reenviar o código.'
      )
    } finally {
      setIsSecurityLoading(false)
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
            disabled={
              isLoading ||
              Boolean(securityChallenge) ||
              (modoRecuperar && !/^[0-9]{6}$/.test(cs))
            }
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

        {securityChallenge && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
              Enviamos um código de segurança para{' '}
              <strong>{securityChallenge.email_hint ?? 'seu email cadastrado'}</strong>. O
              código expira em{' '}
              <strong>
                {new Date(securityChallenge.expires_at).toLocaleString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </strong>
              .
            </div>

            <label style={labelStyle}>Código de segurança</label>
            <input
              type="text"
              value={securityCode}
              onChange={e =>
                setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder=""
              inputMode="numeric"
              style={inputStyle}
            />

            {securityError && <div style={errorStyle}>⚠ {securityError}</div>}

            <button
              type="button"
              onClick={handleSecurityConfirm}
              disabled={
                isSecurityLoading || !/^[0-9]{6}$/.test(securityCode)
              }
              style={buttonStyle}
            >
              {isSecurityLoading ? 'Validando...' : 'Confirmar código'}
            </button>

            <button
              type="button"
              onClick={handleSecurityResend}
              disabled={isSecurityLoading}
              style={{ ...linkButton, marginTop: 8 }}
            >
              {isSecurityLoading ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setModoRecuperar(!modoRecuperar)
            setError(null)
            setSuccessMessage(null)
            setSecurityChallenge(null)
            setSecurityCode('')
            setSecurityError(null)
          }}
          style={linkButton}
        >
          {modoRecuperar ? 'Voltar para login' : 'Recuperar senha'}
        </button>
      </div>
    </div>
  )
}
