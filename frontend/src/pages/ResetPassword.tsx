import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../services/auth'
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

export function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tokenId = params.get('token_id') ?? ''
  const token = params.get('token') ?? ''
  const invalidLink = !tokenId || !token
  const [senha, setSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')
  const [error, setError] = useState<string | null>(
    invalidLink ? 'Link inválido ou expirado.' : null
  )
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (invalidLink) {
      setError('Link inválido ou expirado.')
      return
    }
    if (!senha || !confirmSenha) {
      setError('Informe as duas senhas para continuar.')
      return
    }
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setError(null)
    try {
      setIsLoading(true)
      await confirmPasswordReset({ token_id: tokenId, token, senha })
      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível redefinir a senha.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={page}>
      <div style={card}>
        <div style={header}>
          <img src={logo} alt="TO Works" style={logoStyle} />

          <h1 style={title}>Redefinir senha</h1>

          <span style={subtitle}>Tecnologia Operacional</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nova senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder=""
            style={inputStyle}
            disabled={success}
          />

          <label style={labelStyle}>Confirmar nova senha</label>
          <input
            type="password"
            value={confirmSenha}
            onChange={e => setConfirmSenha(e.target.value)}
            placeholder=""
            style={inputStyle}
            disabled={success}
          />

          {error && <div style={errorStyle}>⚠ {error}</div>}
          {success && (
            <div style={successStyle}>
              Senha atualizada! Agora você pode entrar normalmente.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || invalidLink || success}
            style={buttonStyle}
          >
            {isLoading ? 'Atualizando...' : 'Redefinir senha'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={linkButton}
        >
          Voltar ao login
        </button>
      </div>
    </div>
  )
}
