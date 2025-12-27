"use client";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: DataPoint[];
  title: string;
  maxValue?: number;
}

export function SimpleBarChart({ data, title, maxValue }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((point, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{point.label}</span>
              <span className="text-sm font-bold text-slate-900">{point.value}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  point.color || "bg-gradient-to-r from-blue-500 to-blue-600"
                }`}
                style={{ width: `${(point.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No data available</p>
        </div>
      )}
    </div>
  );
}
