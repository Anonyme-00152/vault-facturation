"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatEUR, formatEURCompact } from "@/lib/format";

const config = {
  amount: { label: "Encaissé", color: "var(--chart-4)" },
} satisfies ChartConfig;

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "short" });
const monthLong = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  const rows = data.map((row) => {
    const date = new Date(`${row.month}-01T12:00:00`);
    return { ...row, label: monthFormat.format(date).replace(".", ""), long: monthLong.format(date) };
  });
  const lastIndex = rows.length - 1;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={rows} margin={{ left: 0, right: 0, top: 8, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} strokeDasharray="3 6" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => formatEURCompact(value).replace(/\s?€/, " k€").replace(/\s?000 k€/, " k€")}
          tickCount={4}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", radius: 8 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => payload?.[0]?.payload?.long ?? ""}
              formatter={(value) => <span className="font-mono tabular">{formatEUR(Number(value))}</span>}
            />
          }
        />
        <Bar dataKey="amount" radius={[8, 8, 4, 4]}>
          {rows.map((row, index) => (
            <Cell
              key={row.month}
              fill={index === lastIndex ? "var(--brand)" : "var(--color-amount)"}
              stroke={index === lastIndex ? "color-mix(in oklab, var(--brand) 60%, black)" : "none"}
              strokeWidth={index === lastIndex ? 1 : 0}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
