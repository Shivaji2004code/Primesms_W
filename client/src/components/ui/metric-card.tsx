import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  color: string;
}

export function MetricCard({ title, value, description, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 