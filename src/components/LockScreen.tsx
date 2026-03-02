import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD ?? 'CapitalPlan2026'

interface LockScreenProps {
  onUnlock: () => void
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password === APP_PASSWORD) {
      onUnlock()
    } else {
      setError('Senha incorreta. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060B16] p-4">
      <Card className="w-full max-w-sm border-[#16213A] bg-[#0D1527]">
        <CardHeader>
          <CardTitle className="text-white font-serif">Plano de Caixa</CardTitle>
          <CardDescription className="text-[#4A5A7A]">
            Digite a senha para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0D1527] border-[#1E2D48] text-[#E0E4F0] font-serif"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#4FC3F7] text-[#060B16] hover:bg-[#4FC3F7]/90 font-semibold font-serif"
            >
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
