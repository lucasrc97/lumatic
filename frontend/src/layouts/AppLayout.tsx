import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";

import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-r md:block">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0" aria-describedby={undefined}>
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Lumatic</span>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
