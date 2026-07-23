"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  addresses: {
    id: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    references: string | null;
    isDefault: boolean;
  }[];
  orders: {
    id: string;
    trackingNumber: string;
    total: number;
    status: string;
    createdAt: string;
    items: { name: string; quantity: number }[];
  }[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [address, setAddress] = useState({
    label: "Principal",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "México",
    references: "",
    isDefault: true,
  });

  async function load() {
    const res = await fetch("/api/profile");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setProfile(data);
    setContact({ name: data.name, phone: data.phone || "" });
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  async function saveContact(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo guardar");
      return;
    }
    setMsg("Datos de contacto actualizados");
    load();
  }

  async function saveAddress(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "address", address }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo guardar la dirección");
      return;
    }
    setMsg("Dirección guardada");
    setAddress({
      label: "Principal",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "México",
      references: "",
      isDefault: true,
    });
    load();
  }

  async function deleteAddress(id: string) {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteAddress", addressId: id }),
    });
    load();
  }

  if (loading) {
    return <div className="section-pad text-ink-muted">Cargando perfil…</div>;
  }

  if (!profile) {
    return (
      <div className="section-pad text-center">
        <p>Debes iniciar sesión.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="section-pad space-y-12">
      <div>
        <h1 className="font-display text-4xl font-semibold">Mi cuenta</h1>
        <p className="mt-2 text-ink-muted">{profile.email}</p>
        {profile.role === "admin" && (
          <Link href="/admin" className="mt-3 inline-block text-sm text-berry">
            Ir al panel de administración →
          </Link>
        )}
      </div>

      {msg && <p className="text-sm text-sage">{msg}</p>}
      {error && <p className="text-sm text-berry">{error}</p>}

      <section className="grid gap-10 lg:grid-cols-2">
        <form onSubmit={saveContact} className="space-y-4">
          <h2 className="font-display text-2xl">Datos de contacto</h2>
          <div>
            <label className="label">Nombre</label>
            <input
              className="field"
              value={contact.name}
              onChange={(e) =>
                setContact({ ...contact, name: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="field"
              value={contact.phone}
              onChange={(e) =>
                setContact({ ...contact, phone: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Guardar contacto
          </button>
        </form>

        <form onSubmit={saveAddress} className="space-y-4">
          <h2 className="font-display text-2xl">Nueva dirección</h2>
          <div>
            <label className="label">Etiqueta</label>
            <input
              className="field"
              value={address.label}
              onChange={(e) =>
                setAddress({ ...address, label: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Calle</label>
            <input
              className="field"
              required
              value={address.street}
              onChange={(e) =>
                setAddress({ ...address, street: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ciudad</label>
              <input
                className="field"
                required
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <input
                className="field"
                required
                value={address.state}
                onChange={(e) =>
                  setAddress({ ...address, state: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">C.P.</label>
              <input
                className="field"
                required
                value={address.postalCode}
                onChange={(e) =>
                  setAddress({ ...address, postalCode: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">País</label>
              <input
                className="field"
                required
                value={address.country}
                onChange={(e) =>
                  setAddress({ ...address, country: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Referencias</label>
            <input
              className="field"
              value={address.references}
              onChange={(e) =>
                setAddress({ ...address, references: e.target.value })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={address.isDefault}
              onChange={(e) =>
                setAddress({ ...address, isDefault: e.target.checked })
              }
            />
            Usar como predeterminada
          </label>
          <button type="submit" className="btn-primary">
            Guardar dirección
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-2xl">Direcciones guardadas</h2>
        {profile.addresses.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Aún no hay direcciones.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {profile.addresses.map((a) => (
              <li key={a.id} className="border border-ink/10 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-wider text-ink-muted">
                  {a.label}
                  {a.isDefault ? " · Predeterminada" : ""}
                </p>
                <p className="mt-2 text-sm">
                  {a.street}
                  <br />
                  {a.city}, {a.state} {a.postalCode}
                  <br />
                  {a.country}
                </p>
                {a.references && (
                  <p className="mt-1 text-xs text-ink-muted">{a.references}</p>
                )}
                <button
                  className="mt-3 text-sm text-berry hover:underline"
                  onClick={() => deleteAddress(a.id)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl">Historial de pedidos</h2>
        {profile.orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Sin pedidos todavía.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {profile.orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4"
              >
                <div>
                  <p className="font-medium">{o.trackingNumber}</p>
                  <p className="text-xs text-ink-muted">
                    {format(new Date(o.createdAt), "d MMM yyyy · HH:mm", {
                      locale: es,
                    })}{" "}
                    · {o.status}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {o.items
                      .map((i) => `${i.name} ×${i.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(o.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
