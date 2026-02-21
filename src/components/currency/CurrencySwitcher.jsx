import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DollarSign, Check } from "lucide-react";
import { useCurrency } from "./CurrencyContext";

const currencies = [
  { code: 'USD', name: 'Dólar (USD)', flag: '🇺🇸' },
  { code: 'ARS', name: 'Peso Argentino', flag: '🇦🇷' }
];

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 rounded-lg"
        >
          <span className="text-base">{currentCurrency?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => {
              setCurrency(curr.code);
              setOpen(false);
            }}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{curr.flag}</span>
              <span>{curr.name}</span>
            </div>
            {currency === curr.code && <Check className="w-4 h-4 text-teal-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}