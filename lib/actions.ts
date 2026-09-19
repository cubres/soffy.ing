"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { adminKeyOk } from "./admin"
import { isNoDatabase } from "./db"
import { requesterHash } from "./hash"
import { isId } from "./ids"
import { createPost, deletePost, reportPost, setHidden, type Draft } from "./posts"

export type SubmitResult = { ok: true; id: string; expiresAt: string } | { ok: false; error: string }

export async function submitPost(draft: Draft): Promise<SubmitResult> {
  try {
    const result = await createPost(draft, await requesterHash())
    if (!result.ok) return result
    revalidatePath("/read")
    revalidatePath("/quote")
    return { ok: true, id: result.id, expiresAt: result.expiresAt.toISOString() }
  } catch (error) {
    if (isNoDatabase(error)) return { ok: false, error: "the site is not connected to its database yet. save your text; it cannot be posted today." }
    console.error("submitPost failed:", error)
    return { ok: false, error: "the site could not save it. try again in a moment." }
  }
}

export async function report(formData: FormData): Promise<void> {
  const id = formData.get("id")
  if (!isId(id)) return
  await reportPost(id, await requesterHash())
  revalidatePath(`/p/${id}`)
  redirect(`/p/${id}?reported=1`)
}

export async function adminAct(formData: FormData): Promise<void> {
  const key = formData.get("key")
  const id = formData.get("id")
  const act = formData.get("act")
  if (!adminKeyOk(key) || !isId(id)) return
  if (act === "hide") await setHidden(id, true)
  else if (act === "unhide") await setHidden(id, false)
  else if (act === "delete") await deletePost(id)
  revalidatePath("/read")
  revalidatePath("/quote")
  revalidatePath(`/p/${id}`)
  redirect(`/admin?key=${encodeURIComponent(key)}`)
}
