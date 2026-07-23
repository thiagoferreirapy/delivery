"use client";
import { useState } from "react";
import type { CourierFullDTO } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { Loader2 } from "lucide-react";
import { PageTitle, Modal, Field, Toggle } from "@/components/ui";
import { ListSkeleton, Skeleton } from "@/components/Skeleton";
import { Icon } from "@/components/icons";
import { useCouriers, useCourierMutations } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { apiUpload, ApiError } from "@/lib/api";

const emptyForm = {
  name: "",
  phone: "",
  password: "",
  active: true,
  birthDate: "",
  cpf: "",
  cnh: "",
  photoUrl: "",
  cpfFrontUrl: "",
  cpfBackUrl: "",
  cnhFrontUrl: "",
  cnhBackUrl: "",
};

// data máxima = 18 anos atrás (impede escolher menor de idade no date picker)
const maxBirth = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
})();

export default function CouriersPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const { data: couriers = [], isLoading } = useCouriers();
  const { create, update } = useCourierMutations();
  const [editing, setEditing] = useState<CourierFullDTO | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [err, setErr] = useState<string | null>(null);

  if (!ready) return null;

  function open(c: CourierFullDTO | "new") {
    setErr(null);
    if (c === "new") setForm(emptyForm);
    else
      setForm({
        name: c.name,
        phone: c.phone,
        password: "",
        active: c.active,
        birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
        cpf: c.cpf ?? "",
        cnh: c.cnh ?? "",
        photoUrl: c.photoUrl ?? "",
        cpfFrontUrl: c.cpfFrontUrl ?? "",
        cpfBackUrl: c.cpfBackUrl ?? "",
        cnhFrontUrl: c.cnhFrontUrl ?? "",
        cnhBackUrl: c.cnhBackUrl ?? "",
      });
    setEditing(c);
  }

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setErr(null);
    const input: any = {
      name: form.name,
      phone: form.phone,
      active: form.active,
      birthDate: form.birthDate,
      cpf: form.cpf,
      cnh: form.cnh,
      photoUrl: form.photoUrl,
      cpfFrontUrl: form.cpfFrontUrl,
      cpfBackUrl: form.cpfBackUrl,
      cnhFrontUrl: form.cnhFrontUrl,
      cnhBackUrl: form.cnhBackUrl,
    };
    if (form.password) input.password = form.password;
    try {
      if (editing === "new") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      setEditing(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Não foi possível salvar. Confira os campos.");
    }
  }

  return (
    <AdminShell>
      <PageTitle
        title="Entregadores"
        subtitle="Cadastro com documentos (CNH, CPF) e foto"
        action={
          <button onClick={() => open("new")} className="btn-primary text-sm">
            <Icon.plus width={16} height={16} /> Novo
          </button>
        }
      />
      {isLoading ? (
        <ListSkeleton leading={<Skeleton className="h-10 w-10 rounded-full" />} />
      ) : (
        <div className="card divide-y divide-black/5">
          {couriers.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 text-lg">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  "🛵"
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.phone}
                  {c.cnh ? " · CNH ✓" : " · sem CNH"}
                </p>
              </div>
              <Toggle checked={c.active} onChange={(v) => update.mutate({ id: c.id, input: { active: v } })} />
              <button onClick={() => open(c)} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-black/5">
                <Icon.edit width={18} height={18} />
              </button>
            </div>
          ))}
          {couriers.length === 0 && <p className="p-6 text-center text-sm text-muted">Nenhum entregador cadastrado.</p>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Novo entregador" : "Editar entregador"}>
        <div className="flex max-h-[75vh] flex-col gap-3 overflow-y-auto pr-1">
          <PhotoField label="Foto do entregador" value={form.photoUrl} onChange={(u) => set("photoUrl")(u)} />

          <Field label="Nome">
            <input className="input" value={form.name} onChange={(e) => set("name")(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefone (login)">
              <input className="input" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="11999990001" />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" max={maxBirth} className="input" value={form.birthDate} onChange={(e) => set("birthDate")(e.target.value)} />
            </Field>
          </div>
          <Field label={editing === "new" ? "Senha" : "Nova senha (opcional)"}>
            <input type="password" className="input" value={form.password} onChange={(e) => set("password")(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF">
              <input className="input" value={form.cpf} onChange={(e) => set("cpf")(e.target.value)} placeholder="000.000.000-00" inputMode="numeric" />
            </Field>
            <Field label="CNH (nº)">
              <input className="input" value={form.cnh} onChange={(e) => set("cnh")(e.target.value)} placeholder="11 dígitos" inputMode="numeric" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PhotoField label="CPF (frente)" value={form.cpfFrontUrl} onChange={(u) => set("cpfFrontUrl")(u)} />
            <PhotoField label="CPF (verso)" value={form.cpfBackUrl} onChange={(u) => set("cpfBackUrl")(u)} />
            <PhotoField label="CNH (frente)" value={form.cnhFrontUrl} onChange={(u) => set("cnhFrontUrl")(u)} />
            <PhotoField label="CNH (verso)" value={form.cnhBackUrl} onChange={(u) => set("cnhBackUrl")(u)} />
          </div>

          <Toggle checked={form.active} onChange={(v) => set("active")(v)} label="Ativo" />
          {err && <p className="text-sm text-danger">{err}</p>}
          <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-1">
            {(create.isPending || update.isPending) && <Loader2 className="animate-spin" width={16} height={16} />}
            Salvar
          </button>
        </div>
      </Modal>
    </AdminShell>
  );
}

function PhotoField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await apiUpload(file);
      onChange(url);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="label">{label}</span>
      <label className="mt-1 flex h-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-black/20 bg-black/[0.02] hover:bg-black/5">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-muted">
            <Icon.camera width={18} height={18} /> {busy ? "Enviando…" : "Enviar foto"}
          </span>
        )}
        <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={busy} />
      </label>
    </div>
  );
}
