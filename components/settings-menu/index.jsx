"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";

// Pages where the settings icon should NOT appear — add paths here as needed.
export const SETTINGS_HIDDEN_PATHS = [
  // "/login",
  // "/create-account",
];

const STORAGE_KEY = "resumestan-settings-position";
const FAB_SIZE = 56;
const PANEL_WIDTH = 224;
const PANEL_GAP = 12;
const MOVE_STEP = 20;
const DRAG_THRESHOLD = 10;
const ESTIMATED_PANEL_HEIGHT = 160;

function computePanelOnLeft(x) {
  if (typeof window === "undefined") return false;
  const spaceLeft = x;
  const spaceRight = window.innerWidth - x - FAB_SIZE;
  return spaceLeft > spaceRight;
}

const NOT_LOGGED_IN_MESSAGE =
  "You're not logged in — log in first, then you can sign out.";

function SettingsIcon({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-6 w-6 transition-transform duration-500 ease-in-out ${
        open ? "rotate-90" : "rotate-0"
      }`}
      aria-hidden="true"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function getDefaultPosition() {
  if (typeof window === "undefined") {
    return { x: 24, y: 24 };
  }

  return clampPosition(
    window.innerWidth - FAB_SIZE - 24,
    window.innerHeight - FAB_SIZE - 24,
  );
}

function computePanelAbove(y, panelHeight) {
  if (typeof window === "undefined") {
    return true;
  }

  const spaceAbove = y;
  const spaceBelow = window.innerHeight - y - FAB_SIZE;
  const needed = panelHeight + PANEL_GAP;

  if (spaceAbove >= needed && spaceBelow < needed) {
    return true;
  }
  if (spaceBelow >= needed && spaceAbove < needed) {
    return false;
  }

  return y > window.innerHeight / 2;
}

function clampPosition(x, y, options = {}) {
  const {
    open = false,
    panelHeight = 0,
    panelAbove = true,
    panelOnLeft = false,
  } = options;

  if (typeof window === "undefined") {
    return { x, y };
  }

  let minX = 0;
  let maxX = Math.max(0, window.innerWidth - FAB_SIZE);

  if (open && PANEL_WIDTH > FAB_SIZE) {
    if (panelOnLeft) {
      // Panel opens to the left (right-0): FAB must be far enough right
      // so the panel doesn't overflow the left edge.
      // Panel left edge = FAB.x + FAB_SIZE - PANEL_WIDTH, must be >= 0
      // => FAB.x >= PANEL_WIDTH - FAB_SIZE
      minX = PANEL_WIDTH - FAB_SIZE;
    } else {
      // Panel opens to the right (left-0): FAB must be far enough left
      // so the panel doesn't overflow the right edge.
      // Panel right edge = FAB.x + PANEL_WIDTH, must be <= innerWidth
      // => FAB.x <= innerWidth - PANEL_WIDTH
      maxX = Math.max(0, window.innerWidth - PANEL_WIDTH);
    }
  }

  let minY = 0;
  let maxY = Math.max(0, window.innerHeight - FAB_SIZE);

  if (open && panelHeight > 0) {
    if (panelAbove) {
      minY = panelHeight + PANEL_GAP;
    } else {
      maxY = Math.max(0, window.innerHeight - FAB_SIZE - PANEL_GAP - panelHeight);
    }
  }

  return {
    x: Math.min(Math.max(minX, x), maxX),
    y: Math.min(Math.max(minY, y), maxY),
  };
}

function loadStoredPosition() {
  if (typeof window === "undefined") {
    return getDefaultPosition();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultPosition();
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") {
      return getDefaultPosition();
    }

    return clampPosition(parsed.x, parsed.y);
  } catch {
    return getDefaultPosition();
  }
}

function savePosition(position) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

export default function SettingsMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);
  const fabRef = useRef(null);
  const panelRef = useRef(null);
  const logoutRef = useRef(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const [position, setPosition] = useState(loadStoredPosition);
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDisabledHint, setShowDisabledHint] = useState(false);
  const [focusedMenuIndex, setFocusedMenuIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [panelAbove, setPanelAbove] = useState(true);
  const [panelOnLeft, setPanelOnLeft] = useState(false);

  const isHidden = SETTINGS_HIDDEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const fitToViewport = useCallback((pos, isOpen) => {
    const panelHeight = isOpen
      ? panelRef.current?.offsetHeight ?? ESTIMATED_PANEL_HEIGHT
      : 0;
    const above = isOpen ? computePanelAbove(pos.y, panelHeight) : true;
    const onLeft = isOpen ? computePanelOnLeft(pos.x) : false;

    setPanelAbove(above);
    setPanelOnLeft(onLeft);

    return clampPosition(pos.x, pos.y, {
      open: isOpen,
      panelHeight,
      panelAbove: above,
      panelOnLeft: onLeft,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setShowDisabledHint(false);
    fabRef.current?.focus();
  }, []);

  const toggleMenu = useCallback(() => {
    setOpen((prev) => !prev);
    setShowDisabledHint(false);
  }, []);

  const nudgePosition = useCallback((dx, dy) => {
    setPosition((prev) => {
      if (!prev) return prev;
      const clamped = clampPosition(prev.x + dx, prev.y + dy);
      savePosition(clamped);
      return clamped;
    });
  }, []);

  useEffect(() => {
    function handleResize() {
      setPosition((prev) => {
        if (!prev) return prev;
        const clamped = fitToViewport(prev, open);
        savePosition(clamped);
        return clamped;
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, fitToViewport]);

  useEffect(() => {
    let cancelled = false;

    async function checkLogin() {
      try {
        const response = await fetch("/api/auth/check-login", {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!cancelled) {
          setIsLoggedIn(Boolean(data.isLoggedIn));
        }
      } catch {
        if (!cancelled) {
          setIsLoggedIn(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingLogin(false);
        }
      }
    }

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;

    // Defer the state update off the synchronous effect body
    const focusTimer = setTimeout(() => setFocusedMenuIndex(0), 0);

    const adjustPosition = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        return fitToViewport(prev, true);
      });
      logoutRef.current?.focus();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(adjustPosition);
    });

    return () => clearTimeout(focusTimer);
  }, [open, isLoggedIn, checkingLogin, fitToViewport]);

  useEffect(() => {
    function handlePointerMove(event) {
      if (
        !dragRef.current.active ||
        dragRef.current.pointerId !== event.pointerId
      ) {
        return;
      }

      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;

      if (
        !dragRef.current.moved &&
        (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
      ) {
        dragRef.current.moved = true;
        setIsDragging(true);
        if (open) {
          closeMenu();
        }
      }

      if (dragRef.current.moved) {
        const next = clampPosition(
          dragRef.current.originX + dx,
          dragRef.current.originY + dy,
        );
        setPosition(next);
      }
    }

    function handlePointerUp(event) {
      if (
        !dragRef.current.active ||
        dragRef.current.pointerId !== event.pointerId
      ) {
        return;
      }

      if (dragRef.current.moved) {
        setPosition((prev) => {
          if (!prev) return prev;
          const clamped = clampPosition(prev.x, prev.y);
          savePosition(clamped);
          return clamped;
        });
      }

      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      setIsDragging(false);

      // Reset moved flag after click handler runs
      setTimeout(() => {
        dragRef.current.moved = false;
      }, 0);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [open, closeMenu]);

  const handleDisabledLogout = () => {
    setShowDisabledHint(true);
    toast.info(NOT_LOGGED_IN_MESSAGE);
  };

  const handleLogout = async () => {
    if (!isLoggedIn || loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Logout failed.");
      }

      setIsLoggedIn(false);
      closeMenu();
      toast.success(data.message || "Logged out successfully.");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleFabClick = () => {
    if (dragRef.current.moved) return;
    toggleMenu();
  };

  const handleFabPointerDown = (event) => {
    // Capture pointer so pointermove/pointerup fire even if finger leaves the element
    // This is essential for touch drag on mobile
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position?.x ?? 0,
      originY: position?.y ?? 0,
    };
  };

  const handleFabKeyDown = (event) => {
    if (open) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        toggleMenu();
        break;
      case "ArrowUp":
        event.preventDefault();
        nudgePosition(0, -MOVE_STEP);
        break;
      case "ArrowDown":
        event.preventDefault();
        nudgePosition(0, MOVE_STEP);
        break;
      case "ArrowLeft":
        event.preventDefault();
        nudgePosition(-MOVE_STEP, 0);
        break;
      case "ArrowRight":
        event.preventDefault();
        nudgePosition(MOVE_STEP, 0);
        break;
      default:
        break;
    }
  };

  const handleMenuKeyDown = (event) => {
    if (!open) return;

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "ArrowDown":
      case "ArrowUp":
        event.preventDefault();
        logoutRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const handleMenuWheel = (event) => {
    if (!open) return;
    event.preventDefault();
    logoutRef.current?.focus();
  };

  if (isHidden || !position) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y, width: FAB_SIZE, height: FAB_SIZE }}
    >
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Settings menu"
          onKeyDown={handleMenuKeyDown}
          onWheel={handleMenuWheel}
          className={`absolute w-56 border border-slate-200 bg-white/95 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur-sm ${
            panelAbove ? "bottom-full mb-3" : "top-full mt-3"
          } ${
            panelOnLeft ? "right-0" : "left-0"
          }`}
        >
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Settings
          </p>

          <div className="relative">
            {showDisabledHint && !isLoggedIn && !checkingLogin && (
              <div className="absolute bottom-full right-0 mb-2 w-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 shadow-lg">
                {NOT_LOGGED_IN_MESSAGE}
              </div>
            )}

            <button
              ref={logoutRef}
              type="button"
              role="menuitem"
              tabIndex={focusedMenuIndex === 0 ? 0 : -1}
              aria-disabled={!isLoggedIn || checkingLogin || loggingOut}
              onClick={() => {
                if (checkingLogin || loggingOut) return;
                if (!isLoggedIn) {
                  handleDisabledLogout();
                  return;
                }
                handleLogout();
              }}
              onMouseEnter={() => {
                if (!isLoggedIn && !checkingLogin) {
                  setShowDisabledHint(true);
                }
              }}
              onMouseLeave={() => setShowDisabledHint(false)}
              className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition outline-none focus:ring-2 focus:ring-sky-400 ${
                isLoggedIn && !checkingLogin && !loggingOut
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>

            {!isLoggedIn && !checkingLogin && (
              <p className="mt-2 px-1 text-xs leading-relaxed text-slate-500">
                {NOT_LOGGED_IN_MESSAGE}
              </p>
            )}
          </div>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        title="Click to open settings • Hold and drag to move"
        aria-label={open ? "Close settings" : "Open settings"}
        aria-expanded={open}
        onClick={handleFabClick}
        onKeyDown={handleFabKeyDown}
        onPointerDown={handleFabPointerDown}
        style={{ touchAction: "none" }}
        className={`flex h-14 w-14 select-none items-center justify-center border border-slate-200 bg-white text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.16)] outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:ring-2 focus:ring-sky-400 active:scale-95 ${
          isDragging ? "cursor-grabbing scale-[1.02]" : "cursor-pointer"
        }`}
      >
        <SettingsIcon open={open} />
      </button>
    </div>
  );
}
