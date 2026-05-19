"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Customer } from "@/types/customer";

type CustomerSelectProps = {
  value: string;
  onChange: (customerId: string) => void;
};

export default function CustomerSelect({
  value,
  onChange,
}: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data) {
        setCustomers(data);
      }

      setLoading(false);
    }

    loadCustomers();
  }, []);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-slate-300">
        Cliente
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white"
      >
        <option value="">
          {loading ? "Caricamento clienti..." : "Seleziona cliente"}
        </option>

        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>
    </div>
  );
}