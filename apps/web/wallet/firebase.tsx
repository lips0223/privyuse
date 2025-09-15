// src/providers/FirebaseProvider.tsx
'use client'

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { createContext, useContext } from 'react'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... 其他配置
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

const FirebaseContext = createContext({})

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  return (
    <FirebaseContext.Provider value={{ loginWithGoogle }}>
      {children}
    </FirebaseContext.Provider>
  )
}

export const useFirebase = () => useContext(FirebaseContext)