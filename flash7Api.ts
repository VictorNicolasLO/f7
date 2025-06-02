// flash7Api.ts
// TypeScript module to interact with the Flash7 API from the browser using fetch

export type ApiConfig = {
  baseUrl: string
}

export class Flash7Api {
  private baseUrl: string

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
  }

  async status() {
    const res = await fetch(`${this.baseUrl}/api/status`)
    return res.text()
  }

  async auth(username: string, password: string) {
    const res = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    return res.json()
  }

  async refreshToken(refreshToken: string) {
    const res = await fetch(`${this.baseUrl}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    return res.json()
  }

  async activateUser(jwt: string) {
    const res = await fetch(`${this.baseUrl}/commands/activate-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt })
    })
    return res.text()
  }

  async post(jwt: string, postKey: string, content: string) {
    const res = await fetch(`${this.baseUrl}/commands/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt, postKey, content })
    })
    return res.text()
  }

  async like(jwt: string, postKey: string) {
    const res = await fetch(`${this.baseUrl}/commands/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt, postKey })
    })
    return res.text()
  }

  async view(jwt: string, postKey: string) {
    const res = await fetch(`${this.baseUrl}/commands/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt, postKey })
    })
    return res.text()
  }

  async comment(jwt: string, postKey: string, content: string) {
    const res = await fetch(`${this.baseUrl}/commands/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt, postKey, content })
    })
    return res.text()
  }

  async follow(jwt: string, followedKey: string) {
    const res = await fetch(`${this.baseUrl}/commands/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt, followedKey })
    })
    return res.text()
  }

  async unfollow(jwt: string, followedKey: string) {
    const res = await fetch(`${this.baseUrl}/commands/unfollow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jwt, followedKey })
    })
    return res.text()
  }

  async personalFeed(userKey: string, startSortKey?: string, limit?: number) {
    const res = await fetch(`${this.baseUrl}/queries/personal-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey, startSortKey, limit })
    })
    return res.json()
  }

  async globalFeed(startSortKey?: string, limit?: number) {
    const res = await fetch(`${this.baseUrl}/queries/global-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startSortKey, limit })
    })
    return res.json()
  }

  async comments(postKey: string, startSortKey?: string, limit?: number) {
    const res = await fetch(`${this.baseUrl}/queries/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postKey, startSortKey, limit })
    })
    return res.json()
  }

  async activeUsers(limit?: number, postKey?: string, textSearch?: string) {
    const res = await fetch(`${this.baseUrl}/queries/active-users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, postKey, textSearch })
    })
    return res.json()
  }

  async userTimeline(userKey: string, startSortKey?: string, limit?: number) {
    const res = await fetch(`${this.baseUrl}/queries/user-timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey, startSortKey, limit })
    })
    return res.json()
  }
}

// Usage example (in your frontend):
// const api = new Flash7Api({ baseUrl: 'http://localhost:3000' })
// await api.auth('user', 'pass')
