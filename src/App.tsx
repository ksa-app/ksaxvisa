import { useState } from 'react'
import { signUp, signIn, signOut } from './auth'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ padding: 20 }}>
      <h2>Auth Demo</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={() => signUp(email, password)}>
        Sign Up
      </button>

      <button onClick={() => signIn(email, password)}>
        Sign In
      </button>

      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  )
}

export default App