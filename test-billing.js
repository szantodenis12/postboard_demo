// Use built-in fetch if available (Node 18+)
async function testBilling() {
  const API = 'http://localhost:5173/api/crm'
  const contract = {
    clientId: 'philatopo',
    title: 'TEST CONTRACT ' + Date.now(),
    startDate: '2026-03-16',
    monthlyValue: 1000,
    status: 'active'
  }

  console.log('Adding contract...')
  try {
    const res = await fetch(`${API}/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contract),
    })
    
    if (res.ok) {
      const json = await res.json()
      console.log('Success:', json)
    } else {
      console.error('Failed:', res.status, await res.text())
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

testBilling()
