"use client";

import { useState, useEffect } from 'react';
import { DateRangeExport } from '@/components/HistoricalExportButton';

interface ExportByDateRangeComponentProps {
  categories: Array<{ _id: string; name: string }>;
}

export function ExportByDateRangeComponent({ categories }: ExportByDateRangeComponentProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  // Establecer fechas predeterminadas (último mes)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  return (
    <DateRangeExport
      startDate={startDate}
      endDate={endDate}
      categoryId={categoryId}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onCategoryChange={setCategoryId}
      categories={categories}
    />
  );
}