// Simple admin UI for managing activities
let ADMIN_TOKEN = null

async function api(path, opts={}){
  if(!ADMIN_TOKEN){
    ADMIN_TOKEN = prompt('Enter admin token (default: secret-token)') || 'secret-token'
  }
  const headers = opts.headers || {}
  headers['X-ADMIN-TOKEN'] = ADMIN_TOKEN
  opts.headers = headers
  const res = await fetch(path, opts)
  if(!res.ok){
    const text = await res.text()
    alert('Error: ' + res.status + '\n' + text)
    throw new Error('API error')
  }
  if(res.status === 204) return null
  return res.json()
}

function renderActivities(data){
  const container = document.getElementById('activities')
  container.innerHTML = ''
  Object.entries(data).forEach(([name, act]) => {
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <strong>${name}</strong>
      <div class="muted">${act.schedule}</div>
      <p>${act.description}</p>
      <div>Participants: ${act.participants.length}/${act.max_participants}</div>
      <div class="actions">
        <button onclick="showParticipants('${encodeURIComponent(name)}')">View Participants</button>
        <button onclick="deleteActivity('${encodeURIComponent(name)}')">Delete</button>
      </div>
    `
    container.appendChild(div)
  })
}

async function loadActivities(){
  const data = await api('/admin/activities')
  renderActivities(data)
}

async function deleteActivity(nameEnc){
  const name = decodeURIComponent(nameEnc)
  if(!confirm(`Delete activity "${name}"?`)) return
  await api(`/admin/activities/${encodeURIComponent(name)}`, { method: 'DELETE' })
  await loadActivities()
}

async function showParticipants(nameEnc){
  const name = decodeURIComponent(nameEnc)
  const parts = await api(`/admin/activities/${encodeURIComponent(name)}/participants`)
  const list = parts.map(p => `<li>${p} <button onclick="removeParticipant('${encodeURIComponent(name)}','${encodeURIComponent(p)}')">Remove</button></li>`).join('')
  alert(`Participants for ${name}:\n\n${parts.join('\n') || '(none)'}`)
}

async function removeParticipant(nameEnc, emailEnc){
  const name = decodeURIComponent(nameEnc)
  const email = decodeURIComponent(emailEnc)
  if(!confirm(`Remove ${email} from ${name}?`)) return
  await api(`/admin/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
  await loadActivities()
}

document.getElementById('create-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const payload = {
    name: document.getElementById('name').value.trim(),
    description: document.getElementById('description').value.trim(),
    schedule: document.getElementById('schedule').value.trim(),
    max_participants: parseInt(document.getElementById('max').value, 10) || 10
  }
  await api('/admin/activities', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  document.getElementById('create-form').reset()
  await loadActivities()
})

// initial load
loadActivities().catch(()=>{})
