"use client";


import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  setYear,
  setMonth,
  getYear,
  getMonth,
} from "date-fns";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* ------------------------------------------------------------------ */
/*  Calendar Grid                                                      */
/* ------------------------------------------------------------------ */

type CalendarProps = {
  selected?: Date | undefined;
  onSelect: (date: Date) => void;
  /** Earliest selectable date */
  minDate?: Date | undefined;
  /** Latest selectable date */
  maxDate?: Date | undefined;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function Calendar({ selected, onSelect, minDate, maxDate }: CalendarProps) {
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const currentMonth = startOfMonth(viewDate);
  const days = useMemo(() => {
    const start = startOfWeek(currentMonth, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrevMonth = useCallback(
    () => setViewDate((d) => subMonths(d, 1)),
    [],
  );
  const handleNextMonth = useCallback(
    () => setViewDate((d) => addMonths(d, 1)),
    [],
  );

  /* Year range for the year-picker dropdown */
  const currentYear = getYear(viewDate);
  const yearRange = useMemo(() => {
    const start = minDate ? getYear(minDate) : currentYear - 100;
    const end = maxDate ? getYear(maxDate) : currentYear + 10;
    const years: number[] = [];
    for (let y = end; y >= start; y--) years.push(y);
    return years;
  }, [currentYear, minDate, maxDate]);

  const isDisabled = (day: Date) => {
    if (minDate && day < minDate) return true;
    if (maxDate && day > maxDate) return true;
    return false;
  };

  return (
    <div className="w-[300px]">
      {/* Header: Month / Year navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowYearPicker(!showYearPicker)}
          className="text-sm font-semibold text-text-primary transition-colors hover:text-accent"
        >
          {format(viewDate, "MMMM yyyy")}
        </button>

        <button
          type="button"
          onClick={handleNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Year + Month picker grid */}
      {showYearPicker && (
        <div className="mb-3 flex gap-2">
          {/* Month selector */}
          <select
            value={getMonth(viewDate)}
            onChange={(e) => {
              setViewDate((d) => setMonth(d, Number(e.target.value)));
            }}
            className="flex-1 appearance-none rounded-xl bg-surface-secondary/70 border-none px-3 py-2 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={getYear(viewDate)}
            onChange={(e) => {
              setViewDate((d) => setYear(d, Number(e.target.value)));
              setShowYearPicker(false);
            }}
            className="w-24 appearance-none rounded-xl bg-surface-secondary/70 border-none px-3 py-2 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            {yearRange.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-0">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-text-muted"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const today = isToday(day);
          const disabled = isDisabled(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect(day);
              }}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-xl text-sm font-medium transition-all",
                !inMonth && "text-text-muted/40",
                inMonth && !isSelected && "text-text-primary hover:bg-surface-secondary",
                today && !isSelected && "font-bold text-accent",
                isSelected &&
                  "bg-ink text-accent-foreground font-semibold shadow-sm hover:bg-ink-hover",
                disabled && "pointer-events-none opacity-30",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <div className="mt-3 flex justify-center border-t border-border pt-3">
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            if (!isDisabled(now)) {
              onSelect(now);
              setViewDate(now);
            }
          }}
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent-muted"
        >
          Today
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DatePicker (Popover + Calendar)                                    */
/* ------------------------------------------------------------------ */

type DatePickerProps = {
  /** Current value as a Date or null */
  value: Date | null;
  /** Callback when a date is picked */
  onChange: (date: Date) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Display format (date-fns format string) */
  displayFormat?: string;
  /** Earliest selectable date */
  minDate?: Date;
  /** Latest selectable date */
  maxDate?: Date;
  /** Additional class names for the trigger */
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  displayFormat = "MMM d, yyyy",
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-2xl bg-surface-secondary/70 border-none px-4 py-3 text-left text-sm font-medium transition-all",
            "focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent",
            value ? "text-text-primary" : "text-text-muted",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-text-muted" />
          <span className="truncate">
            {value ? format(value, displayFormat) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-4">
        <Calendar
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}
