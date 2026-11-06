/**
 * Placeholder page for admin section tabs that start in Stage 4
 * (Interest Requests, Connections).
 */
export default function AdminPlaceholder({ what = 'This section' }) {
  return (
    <div className="admin-placeholder-big">
      <h1 style={{ fontSize: 22, marginTop: 0 }}>{what}</h1>
      <p>
        Interest requests and connections arrive in <strong>Stage 4</strong>.<br />
        Stats for them already exist on this dashboard and will fill in then.
      </p>
    </div>
  )
}
