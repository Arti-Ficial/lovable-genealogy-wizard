
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  enableYearNavigation?: boolean;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  enableYearNavigation = false,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    props.month || new Date()
  );
  const [viewMode, setViewMode] = React.useState<'days' | 'months' | 'years'>('days');
  const [yearRange, setYearRange] = React.useState<{ start: number; end: number }>(() => {
    const currentYear = new Date().getFullYear();
    const decade = Math.floor(currentYear / 10) * 10;
    return { start: decade, end: decade + 9 };
  });

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setViewMode('months');
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month);
    setCurrentMonth(newDate);
    setViewMode('days');
  };

  const navigateYearRange = (direction: 'prev' | 'next') => {
    const step = direction === 'next' ? 10 : -10;
    setYearRange(prev => ({
      start: prev.start + step,
      end: prev.end + step
    }));
  };

  const renderYearView = () => {
    const years = [];
    for (let year = yearRange.start; year <= yearRange.end; year++) {
      years.push(
        <button
          key={year}
          onClick={() => handleYearSelect(year)}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-16 p-0 font-normal",
            year === currentMonth.getFullYear() && "bg-primary text-primary-foreground"
          )}
        >
          {year}
        </button>
      );
    }

    return (
      <div className="p-3">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigateYearRange('prev')}
            className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 p-0")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-medium">
            {yearRange.start} - {yearRange.end}
          </div>
          <button
            onClick={() => navigateYearRange('next')}
            className={cn(buttonVariants({ variant: "outline" }), "h-7 w-7 p-0")}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {years}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const months = [
      'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ];

    return (
      <div className="p-3">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setViewMode('years')}
            className={cn(buttonVariants({ variant: "ghost" }), "font-medium")}
          >
            {currentMonth.getFullYear()}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <button
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 p-0 font-normal",
                index === currentMonth.getMonth() && "bg-primary text-primary-foreground"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (enableYearNavigation) {
    if (viewMode === 'years') {
      return (
        <div className={cn("p-3", className)}>
          {renderYearView()}
        </div>
      );
    }

    if (viewMode === 'months') {
      return (
        <div className={cn("p-3", className)}>
          {renderMonthView()}
        </div>
      );
    }
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: enableYearNavigation ? "text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-2 py-1" : "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: ({ displayMonth }) => (
          <div className="flex justify-center pt-1 relative items-center">
            <button
              onClick={() => enableYearNavigation && setViewMode('years')}
              className={cn(
                "text-sm font-medium",
                enableYearNavigation && "cursor-pointer hover:bg-accent hover:text-accent-foreground rounded px-2 py-1"
              )}
            >
              {displayMonth.toLocaleDateString('de-DE', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </button>
          </div>
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
