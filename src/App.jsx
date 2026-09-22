import { useState, useEffect } from 'react'

const API = 'http://localhost:8080/api/v1'

function App() {
  const [token, setToken] = useState(localStorage.getItem('owner_token') || '')
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('listings')
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', price_daily: '', city: '', category_id: '' })
  const [categories, setCategories] = useState([])

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })

  useEffect(() => {
    if (token) {
      fetch(`${API}/me`, { headers: headers() })
        .then((r) => r.json())
        .then((d) => setUser(d))
        .catch(() => {
          setToken('')
          localStorage.removeItem('owner_token')
        })
      loadListings()
      loadBookings()
      fetch(`${API}/categories`).then((r) => r.json()).then(setCategories).catch(() => {})
    }
  }, [token])

  const login = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      setToken(data.token)
      localStorage.setItem('owner_token', data.token)
      setUser(data.user)
    } catch (err) {
      setError(err.message)
    }
  }

  const loadListings = () =>
    fetch(`${API}/my/listings`, { headers: headers() })
      .then((r) => r.json())
      .then(setListings)
      .catch(() => {})

  const loadBookings = () =>
    fetch(`${API}/bookings?as=owner`, { headers: headers() })
      .then((r) => r.json())
      .then(setBookings)
      .catch(() => {})

  const createListing = async (e) => {
    e.preventDefault()
    const body = {
      ...form,
      price_daily: parseFloat(form.price_daily) || 0,
      status: 'active',
      currency: 'USD',
    }
    const res = await fetch(`${API}/listings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setForm({ title: '', description: '', price_daily: '', city: '', category_id: '' })
      loadListings()
      setPage('listings')
    }
  }

  const updateBooking = async (id, status) => {
    await fetch(`${API}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status }),
    })
    loadBookings()
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={login} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border">
          <div className="text-center mb-6">
            <div className="text-3xl font-extrabold text-slate-800">Kodisha</div>
            <p className="text-slate-500 text-sm">Owner Dashboard</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <input
            className="w-full mb-3 px-4 py-2.5 border rounded-xl"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full mb-4 px-4 py-2.5 border rounded-xl"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700">
            Sign in
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="text-xl font-bold mb-1">Kodisha</div>
        <div className="text-teal-400 text-xs mb-8">Owner Dashboard</div>
        <nav className="space-y-1 flex-1">
          {[
            ['listings', 'My Listings'],
            ['create', 'New Listing'],
            ['bookings', 'Bookings'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setPage(k)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                page === k ? 'bg-teal-600' : 'hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="text-sm text-slate-400 mb-2">{user?.full_name || user?.email}</div>
        <button
          onClick={() => {
            setToken('')
            localStorage.removeItem('owner_token')
          }}
          className="text-left text-sm text-red-400 hover:text-red-300"
        >
          Sign out
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {page === 'listings' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">My Listings</h1>
            <div className="grid gap-4">
              {listings.length === 0 && <p className="text-slate-500">No listings yet.</p>}
              {listings.map((l) => (
                <div key={l.id} className="bg-white border rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-800">{l.title}</div>
                    <div className="text-sm text-slate-500">
                      {l.city} · ${l.price_daily}/day · <span className="uppercase">{l.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'create' && (
          <div className="max-w-xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">New Listing</h1>
            <form onSubmit={createListing} className="bg-white border rounded-xl p-6 space-y-4">
              <input
                className="w-full px-4 py-2.5 border rounded-xl"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="w-full px-4 py-2.5 border rounded-xl"
                placeholder="Description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <select
                className="w-full px-4 py-2.5 border rounded-xl"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <input
                className="w-full px-4 py-2.5 border rounded-xl"
                placeholder="Daily price"
                type="number"
                value={form.price_daily}
                onChange={(e) => setForm({ ...form, price_daily: e.target.value })}
                required
              />
              <input
                className="w-full px-4 py-2.5 border rounded-xl"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <button className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-semibold">Publish</button>
            </form>
          </div>
        )}

        {page === 'bookings' && (
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Bookings</h1>
            <div className="space-y-4">
              {bookings.length === 0 && <p className="text-slate-500">No bookings yet.</p>}
              {bookings.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-5">
                  <div className="font-semibold">{b.listing?.title || 'Listing'}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {b.start_date?.split('T')[0]} → {b.end_date?.split('T')[0]} · ${b.total_amount} · {b.status}
                  </div>
                  {b.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updateBooking(b.id, 'confirmed')}
                        className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateBooking(b.id, 'cancelled')}
                        className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
