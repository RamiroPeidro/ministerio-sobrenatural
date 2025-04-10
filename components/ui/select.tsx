"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
});

const Select = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void; disabled?: boolean }
>(({ value, onValueChange, disabled, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, disabled }}>
      <div ref={ref} {...props} />
    </SelectContext.Provider>
  );
});
Select.displayName = "Select";

const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-1", className)}
    {...props}
  />
));
SelectGroup.displayName = "SelectGroup";

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block truncate", className)}
    {...props}
  />
));
SelectValue.displayName = "SelectValue";

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }
>(({ className, children, placeholder, ...props }, ref) => {
  const { value, open, setOpen, disabled } = React.useContext(SelectContext);
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => !disabled && setOpen(!open)}
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children || (value ? value : placeholder && <span className="text-muted-foreground">{placeholder}</span>)}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item-aligned" }
>(({ className, position = "popper", ...props }, ref) => {
  const { open } = React.useContext(SelectContext);
  
  if (!open) return null;
  
  return (
    <div className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => document.body.click()}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 max-h-60 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" ? "w-[--trigger-width] translate-y-1" : "",
          className
        )}
        {...props}
      />
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected ? "bg-accent text-accent-foreground" : "",
        className
      )}
      role="option"
      aria-selected={isSelected}
      data-selected={isSelected ? "" : undefined}
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
}
