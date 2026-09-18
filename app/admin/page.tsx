import type { Metadata } from "next"
import { adminAct } from "@/lib/actions"
import { adminKeyOk } from "@/lib/admin"
import { adminList } from "@/lib/posts"
import { fmtDate, plural } from "@/lib/time"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "admin",
  robots: { index: false, follow: false, noarchive: true },
}

// React's form actions do not pass the submit button's own name and value along,
// so each action is its own form with the verb in a hidden field.
function AdminButton({ act, id, adminKey, loss = false }: { act: string; id: string; adminKey: string; loss?: boolean }) {
  return (
    <form action={adminAct} style={{ margin: 0 }}>
      <input type="hidden" name="key" value={adminKey} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="act" value={act} />
      <button className={loss ? "t loss" : "t"} type="submit">
        [{act}]
      </button>
    </form>
  )
}

// The only door with a key. Open it with /admin?key=<ADMIN_KEY>. Without the key it is a blank wall.
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams
  if (!adminKeyOk(key)) return <p className="muted">nothing here.</p>

  const posts = await adminList()
  const now = Date.now()

  return (
    <>
      <p className="muted">
        {plural(posts.length, "post")} in the table, including hidden and expired ones. newest first. this number is yours alone.
      </p>
      {posts.map((p) => (
        <article key={p.id}>
          <p className="sep">· · ·</p>
          <p className="muted">
            {p.id} · {fmtDate(p.created_at)} · {plural(p.word_count, "word")} · {plural(p.reports, "report")} ·{" "}
            {p.hidden ? "hidden" : "visible"} ·{" "}
            {new Date(p.expires_at).getTime() < now ? "expired" : `vanishes ${fmtDate(p.expires_at)}`}
          </p>
          <div className="body">
            {p.body.slice(0, 600)}
            {p.body.length > 600 && "…"}
          </div>
          <div className="row">
            <AdminButton act={p.hidden ? "unhide" : "hide"} id={p.id} adminKey={key} />
            <AdminButton act="delete" id={p.id} adminKey={key} loss />
            <a href={`/p/${p.id}`}>[open]</a>
          </div>
        </article>
      ))}
    </>
  )
}
