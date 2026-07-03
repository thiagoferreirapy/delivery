"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AddressDTO, AddressInput } from "@cabana/shared";
import {
  useAddresses,
  useAddressMutations,
  useUpdateProfile,
  useChangePassword,
} from "@/lib/queries";
import { ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectSocket } from "@/lib/socket";
import { TabShell } from "@/components/TabShell";
import { PageHeader, Spinner } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { IconPlus, IconMapPin, IconPencil, IconKey, IconPhone } from "@/components/icons";

const empty: AddressInput = {
  label: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const { data: addresses = [], isLoading } = useAddresses();
  const { create, update, remove } = useAddressMutations();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // ----- Endereços -----
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddressInput>(empty);
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: k === "isDefault" ? e.target.checked : e.target.value });

  // ----- Dados pessoais / senha -----
  const [sheet, setSheet] = useState<null | "profile" | "password">(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [formError, setFormError] = useState<string | null>(null);

  function startNew() {
    setForm(empty);
    setEditing("new");
  }
  function startEdit(a: AddressDTO) {
    setForm({ ...a, complement: a.complement ?? "" });
    setEditing(a.id);
  }
  async function save() {
    if (editing === "new") await create.mutateAsync(form);
    else if (editing) await update.mutateAsync({ id: editing, input: form });
    setEditing(null);
  }

  function openProfile() {
    setProfileForm({ name: user?.name ?? "", phone: user?.phone ?? "" });
    setFormError(null);
    setSheet("profile");
  }
  function openPassword() {
    setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    setFormError(null);
    setSheet("password");
  }
  async function saveProfile() {
    setFormError(null);
    const name = profileForm.name.trim();
    const phone = profileForm.phone.trim();
    if (name.length < 2) return setFormError("Informe um nome com pelo menos 2 letras.");
    try {
      await updateProfile.mutateAsync({ name, phone: phone || null });
      setSheet(null);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Não foi possível salvar.");
    }
  }
  async function savePassword() {
    setFormError(null);
    if (!pwForm.currentPassword) return setFormError("Informe a senha atual.");
    if (pwForm.newPassword.length < 6) return setFormError("A nova senha precisa ter no mínimo 6 caracteres.");
    if (pwForm.newPassword !== pwForm.confirm) return setFormError("A confirmação não confere com a nova senha.");
    try {
      await changePassword.mutateAsync({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setSheet(null);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Não foi possível alterar a senha.");
    }
  }

  function logout() {
    clear();
    disconnectSocket();
    router.replace("/login");
  }

  if (!ready) return <Spinner />;

  return (
    <TabShell>
      <PageHeader title="Perfil" />
      <div className="flex flex-col gap-5 p-4">
        {/* Dados pessoais */}
        <section className="card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand/10 text-lg font-bold text-brand">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-sm text-muted">{user?.email}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3 text-sm">
            <IconPhone className="text-muted" width={16} height={16} />
            <span className="text-muted">Telefone:</span>
            <span className={user?.phone ? "font-medium text-ink" : "text-muted/70"}>
              {user?.phone || "não informado"}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={openProfile}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand/30 py-2 text-sm font-semibold text-brand transition active:scale-[0.98]"
            >
              <IconPencil width={15} height={15} /> Editar dados
            </button>
            <button
              onClick={openPassword}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 py-2 text-sm font-semibold text-ink transition active:scale-[0.98]"
            >
              <IconKey width={15} height={15} /> Alterar senha
            </button>
          </div>
        </section>

        {/* Endereços */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Endereços</h2>
            <button onClick={startNew} className="flex items-center gap-1 text-sm font-semibold text-brand">
              <IconPlus width={16} height={16} /> Novo
            </button>
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <div className="flex flex-col gap-2">
              {addresses.map((a) => (
                <div key={a.id} className="card flex items-start gap-3 p-3">
                  <IconMapPin className="mt-0.5 text-brand" width={18} height={18} />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-ink">
                      {a.label} {a.isDefault && <span className="ml-1 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">PADRÃO</span>}
                    </p>
                    <p className="text-muted">{a.street}, {a.number} — {a.neighborhood}, {a.city}/{a.state}</p>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button onClick={() => startEdit(a)} className="text-brand">Editar</button>
                    <button onClick={() => remove.mutate(a.id)} className="text-danger">Excluir</button>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && <p className="text-sm text-muted">Nenhum endereço cadastrado.</p>}
            </div>
          )}
        </section>

        <button onClick={logout} className="btn-ghost w-full text-danger">Sair</button>
      </div>

      {/* Bottom-sheet: editar dados pessoais */}
      {sheet === "profile" && (
        <Sheet title="Editar dados" onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted">Nome</label>
            <input
              className="input"
              placeholder="Seu nome"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
            <label className="mt-1 text-xs font-medium text-muted">Telefone</label>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              inputMode="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
            <label className="mt-1 text-xs font-medium text-muted">E-mail</label>
            <input className="input opacity-60" value={user?.email ?? ""} readOnly disabled />
            <p className="text-xs text-muted/80">O e-mail não pode ser alterado por aqui.</p>
          </div>
          {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
          <button onClick={saveProfile} disabled={updateProfile.isPending} className="btn-primary mt-4 w-full">
            {updateProfile.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
            Salvar
          </button>
        </Sheet>
      )}

      {/* Bottom-sheet: alterar senha */}
      {sheet === "password" && (
        <Sheet title="Alterar senha" onClose={() => setSheet(null)}>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted">Senha atual</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
            <label className="mt-1 text-xs font-medium text-muted">Nova senha</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
            <label className="mt-1 text-xs font-medium text-muted">Confirmar nova senha</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            />
          </div>
          {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
          <button onClick={savePassword} disabled={changePassword.isPending} className="btn-primary mt-4 w-full">
            {changePassword.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
            Salvar nova senha
          </button>
        </Sheet>
      )}

      {/* Bottom-sheet: endereço */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="w-full max-w-app rounded-t-3xl bg-cream p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
            <h3 className="mb-3 font-display text-lg font-bold text-ink">
              {editing === "new" ? "Novo endereço" : "Editar endereço"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input className="input col-span-2" placeholder="Rótulo (Casa, Trabalho)" value={form.label} onChange={set("label")} />
              <input className="input" placeholder="CEP" value={form.cep} onChange={set("cep")} />
              <input className="input" placeholder="Número" value={form.number} onChange={set("number")} />
              <input className="input col-span-2" placeholder="Rua" value={form.street} onChange={set("street")} />
              <input className="input col-span-2" placeholder="Complemento" value={form.complement ?? ""} onChange={set("complement")} />
              <input className="input col-span-2" placeholder="Bairro" value={form.neighborhood} onChange={set("neighborhood")} />
              <input className="input" placeholder="Cidade" value={form.city} onChange={set("city")} />
              <input className="input" placeholder="UF" maxLength={2} value={form.state} onChange={set("state")} />
              <label className="col-span-2 flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={!!form.isDefault} onChange={set("isDefault")} className="accent-brand" />
                Definir como padrão
              </label>
            </div>
            <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-4 w-full">
              {(create.isPending || update.isPending) && <Loader2 className="animate-spin" width={18} height={18} />}
              Salvar
            </button>
          </div>
        </div>
      )}
    </TabShell>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-app rounded-t-3xl bg-cream p-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
        <h3 className="mb-3 font-display text-lg font-bold text-ink">{title}</h3>
        {children}
      </div>
    </div>
  );
}
