'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface NavigationGuardContextType {
  registerGuard: (fn: () => boolean) => void;
  unregisterGuard: () => void;
  requestNavigation: (href: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | null>(null);

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const guardFnRef = useRef<(() => boolean) | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const registerGuard = useCallback((fn: () => boolean) => {
    guardFnRef.current = fn;
  }, []);

  const unregisterGuard = useCallback(() => {
    guardFnRef.current = null;
  }, []);

  const requestNavigation = useCallback(
    (href: string) => {
      if (guardFnRef.current && guardFnRef.current()) {
        setPendingHref(href);
        setShowDialog(true);
      } else {
        router.push(href);
      }
    },
    [router]
  );

  const confirmLeave = useCallback(() => {
    guardFnRef.current = null;
    if (pendingHref) {
      router.push(pendingHref);
    }
    setPendingHref(null);
    setShowDialog(false);
  }, [router, pendingHref]);

  const cancelLeave = useCallback(() => {
    setPendingHref(null);
    setShowDialog(false);
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ registerGuard, unregisterGuard, requestNavigation }}>
      {children}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) cancelLeave(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you leave now, they will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={cancelLeave}>Stay</Button>
            <Button variant="destructive" onClick={confirmLeave}>Leave without saving</Button>
          </div>
        </DialogContent>
      </Dialog>
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  return ctx;
}
