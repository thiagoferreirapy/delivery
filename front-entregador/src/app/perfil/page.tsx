"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CourierShell } from "@/components/CourierShell";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectSocket } from "@/lib/socket";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useDeliveries, useCourierProfile, useUpdateCourierProfile, useChangeCourierPassword } from "@/lib/queries";
import { apiUpload, ApiError } from "@/lib/api";
import { IconLogout, IconCamera, IconKey } from "@/components/icons";

function formatCpf(cpf: string) {
  const s = cpf.replace(/\D/g, "");
  return s.length === 11 ? `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}` : cpf;
}

export default function ProfilePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clear = useAuthStore((s) => s.clear);
  const { data: done = [] } = useDeliveries(true);
  const { data: profile } = useCourierProfile();
  const updateProfile = useUpdateCourierProfile();
  const changePassword = useChangeCourierPassword();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  if (!ready) return null;

  const photo = profile?.photoUrl ?? user?.photoUrl ?? null;
  const displayName = profile?.name ?? user?.name ?? "";
  const phone = profile?.phone ?? user?.phone ?? "";

  function openEdit() {
    setName(displayName);
    setPhotoUrl(photo);
    setError(null);
    setEditing(true);
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await apiUpload(file);
      setPhotoUrl(url);
    } finally {
      setUploading(false);
    }
  }
  async function save() {
    setError(null);
    const nm = name.trim();
    if (nm.length < 2) return setError("Informe um nome com pelo menos 2 letras.");
    try {
      const updated = await updateProfile.mutateAsync({ name: nm, photoUrl });
      updateUser({ name: updated.name, photoUrl: updated.photoUrl });
      setEditing(false);
    } catch {
      setError("Não foi possível salvar.");
    }
  }
  function openPw() {
    setPw({ current: "", next: "", confirm: "" });
    setPwError(null);
    setPwOpen(true);
  }
  async function savePw() {
    setPwError(null);
    if (!pw.current) return setPwError("Informe a senha atual.");
    if (pw.next.length < 6) return setPwError("A nova senha precisa ter no mínimo 6 caracteres.");
    if (pw.next !== pw.confirm) return setPwError("A confirmação não confere com a nova senha.");
    try {
      await changePassword.mutateAsync({ currentPassword: pw.current, newPassword: pw.next });
      setPwOpen(false);
      toast.success("Senha alterada com sucesso.");
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : "Não foi possível alterar a senha.");
    }
  }
  function logout() {
    clear();
    disconnectSocket();
    router.replace("/login");
  }

  return (
    <CourierShell>
      <div className="flex flex-col gap-4 p-4">
        {/* Cabeçalho do perfil */}
        <div className="card flex items-center gap-3 p-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 text-2xl font-bold text-brand">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              displayName?.[0]?.toUpperCase() ?? "?"
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold text-ink">{displayName}</p>
            <p className="truncate text-sm text-muted">{phone}</p>
          </div>
          <button onClick={openEdit} className="rounded-xl border border-brand/30 px-3 py-1.5 text-sm font-semibold text-brand transition active:scale-95">
            Editar
          </button>
        </div>

        {/* Entregas concluídas */}
        <div className="card p-4">
          <p className="text-sm text-muted">Entregas concluídas</p>
          <p className="font-display text-3xl font-bold text-brand">{done.length}</p>
        </div>

        {/* Documentos (cadastrados pela administração) */}
        <div className="card p-4">
          <h2 className="mb-2 font-semibold text-ink">Documentos</h2>
          <ul className="space-y-2 text-sm">
            <DocRow label="Foto do entregador" ok={!!profile?.photoUrl} />
            <DocRow label="CNH" ok={!!profile?.cnh} detail={profile?.cnh ?? undefined} />
            <DocRow label="CPF" ok={!!profile?.cpf} detail={profile?.cpf ? formatCpf(profile.cpf) : undefined} />
            <DocRow
              label="Nascimento"
              ok={!!profile?.birthDate}
              detail={profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString("pt-BR") : undefined}
            />
          </ul>
          <p className="mt-2 text-xs text-muted">Documentos são cadastrados pela administração.</p>
        </div>

        <button onClick={openPw} className="btn-ghost w-full">
          <IconKey width={18} height={18} /> Alterar senha
        </button>

        <button onClick={logout} className="btn-ghost w-full text-danger">
          <IconLogout width={18} height={18} /> Sair
        </button>
      </div>

      {/* Sheet: editar nome + foto */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditing(false)}>
          <div className="w-full max-w-app rounded-t-3xl bg-cream p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
            <h3 className="mb-3 font-display text-lg font-bold text-ink">Editar perfil</h3>
            <div className="flex flex-col items-center gap-2">
              <label className="grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full bg-brand/10 hover:bg-brand/20">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <IconCamera className="text-brand" width={24} height={24} />
                )}
                <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={uploading} />
              </label>
              <span className="text-xs text-muted">{uploading ? "Enviando foto…" : "Toque para trocar a foto"}</span>
              <input className="input mt-1 w-full" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <button onClick={save} disabled={updateProfile.isPending || uploading} className="btn-primary mt-4 w-full">
              {updateProfile.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Sheet: alterar senha */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setPwOpen(false)}>
          <div className="w-full max-w-app rounded-t-3xl bg-cream p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
            <h3 className="mb-3 font-display text-lg font-bold text-ink">Alterar senha</h3>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted">Senha atual</label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
              />
              <label className="mt-1 text-xs font-medium text-muted">Nova senha</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
              <label className="mt-1 text-xs font-medium text-muted">Confirmar nova senha</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </div>
            {pwError && <p className="mt-2 text-sm text-danger">{pwError}</p>}
            <button onClick={savePw} disabled={changePassword.isPending} className="btn-primary mt-4 w-full">
              {changePassword.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
              Salvar nova senha
            </button>
          </div>
        </div>
      )}
    </CourierShell>
  );
}

function DocRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={`text-xs font-semibold ${ok ? "text-success" : "text-warning"}`}>
        {detail ?? (ok ? "cadastrado" : "pendente")}
      </span>
    </li>
  );
}
