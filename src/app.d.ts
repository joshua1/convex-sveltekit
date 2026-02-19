declare global {
  namespace App {
    interface Locals {
      convexToken?: string
      user?: {
        id: string
        email: string
        name: string
        image?: string | null
      }
    }
  }
}

export {}
