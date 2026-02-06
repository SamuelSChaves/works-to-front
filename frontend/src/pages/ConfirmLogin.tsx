import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { consumePostLoginRedirect, confirmLoginLink } from '../services/auth'
import logo from '../assets/ToWorks.png'
import {
  buttonStyle,
  card,
  header,
  logoStyle,
  page,
  subtitle,
  title
} from './authStyles'

export function ConfirmLogin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const linkId = searchParams.get('link_id')
  const token = searchParams.get('token')
  const hasValidParams = Boolean(linkId && token)
  const [status, setStatus] = useState<'pending' | 'error'>(() =>
    hasValidParams ? 'pending' : 'error'
  )
  const [message, setMessage] = useState(() =>
    hasValidParams
      ? 'Validando o link de acesso...'
      : 'Link inválido.'
  )

  useEffect(() => {
    if (!linkId || !token) {
      return
    }

    void (async () => {
      try {
        await confirmLoginLink(linkId, token)
        const redirect = consumePostLoginRedirect()
        navigate(redirect || '/app', { replace: true })
      } catch (err) {
        setStatus('error')
        setMessage(
          err instanceof Error
            ? err.message
            : 'Não foi possível confirmar o link de login.'
        )
      }
    })()
  }, [navigate, linkId, token])

  return (
    <div style={page}>
      <div style={{ ...card, minHeight: 320 }}>
        <div style={header}>
          <img src={logo} alt="TO Works" style={logoStyle} />
          <h1 style={title}>TO Works</h1>
          <span style={subtitle}>Tecnologia Operacional</span>
        </div>
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          {status === 'pending' ? (
            'Validando link de acesso...'
          ) : (
            <div>
              <div style={{ color: '#c6362c', marginBottom: 12 }}>{message}</div>
              <button
                type="button"
                onClick={() => navigate('/', { replace: true })}
                style={buttonStyle}
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
