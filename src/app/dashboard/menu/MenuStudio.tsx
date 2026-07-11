"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n, useTranslations } from "@/i18n/client";
import { compressImageForUpload, MENU_BG_IMAGE_COMPRESS } from "@/lib/compress-image";
import {
  isMenuVideoFile,
  rasterizePdfPages,
  validateMenuVideoFile,
} from "@/lib/menu-media";
import {
  DEFAULT_MENU_BACKGROUND,
  DEFAULT_MENU_STYLE,
  MENU_CATALOG,
  MENU_CURRENCIES,
  MAX_DISH_PHOTOS,
  defaultPayloadForType,
  emptyLocaleMap,
  groupMenuNodes,
  localeMapDraft,
  newClientId,
  parseMenuBackground,
  parseMenuEntryMode,
  parseMenuInfo,
  parseMenuStyle,
  pickLocaleMapSource,
  reindexPositions,
  resolveLocaleMap,
  sortMenuNodes,
  type LocaleMap,
  type MenuEntryMode,
  type MenuInfo,
  type MenuNode,
  type MenuNodeType,
  type MenuStyle,
  type MenuBackground,
} from "@/lib/menu";
import type { Locale } from "@/i18n/config";
import type { Merchant } from "@/lib/types";
import { MenuPublicView } from "@/components/menu/MenuPublicView";
import { MenuSelect } from "@/components/menu/MenuSelect";
import { MenuColorField } from "@/components/menu/MenuColorField";
import { MenuMediaCropper } from "@/components/menu/MenuMediaCropper";
import { DockSheet } from "@/components/menu/DockSheet";
import { ui } from "@/components/ui/styles";
import { QRFontPicker } from "@/app/dashboard/qr/QRFontPicker";
import { ensureQRFontLoaded } from "@/lib/qr-fonts";
import {
  publicMerchantMenuUrl,
  publicMerchantPlayUrl,
  publicMerchantUrl,
} from "@/lib/app-url";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type StudioTab = "menu" | "info" | "style" | "background" | "share" | null;
type HistorySnap = {
  nodes: MenuNode[];
  style: MenuStyle;
  background: MenuBackground;
  info: MenuInfo;
  entryMode: MenuEntryMode;
  enabled: boolean;
};

function cloneSnap(s: HistorySnap): HistorySnap {
  return JSON.parse(JSON.stringify(s)) as HistorySnap;
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 15 3 9l6-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 9h12a6 6 0 0 1 0 12h-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 9l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 15H9a6 6 0 0 1 0-12h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M12 20h9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuStudio({
  merchant,
  initialNodes,
}: {
  merchant: Merchant;
  initialNodes: MenuNode[];
}) {
  const t = useTranslations();
  const { locale } = useI18n();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [tab, setTab] = useState<StudioTab>("menu");
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [cropJob, setCropJob] = useState<{
    file: File;
    onDone: (file: File) => void;
  } | null>(null);

  const [nodes, setNodes] = useState<MenuNode[]>(initialNodes);
  const [style, setStyle] = useState<MenuStyle>(
    parseMenuStyle(merchant.menu_style, merchant.primary_color),
  );
  const [background, setBackground] = useState<MenuBackground>(
    parseMenuBackground(merchant.menu_background),
  );
  const [info, setInfo] = useState<MenuInfo>(parseMenuInfo(merchant.menu_info));
  const [entryMode, setEntryMode] = useState<MenuEntryMode>(
    parseMenuEntryMode(merchant.menu_entry_mode),
  );
  const [enabled, setEnabled] = useState(Boolean(merchant.menu_enabled));

  const draftKey = `menu-studio-draft:${merchant.id}`;
  const draftReadyRef = useRef(false);

  // Restore local draft when DB is empty / migration missing (survives refresh).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<HistorySnap> & { savedAt?: number };
        if (draft?.nodes?.length && initialNodes.length === 0) {
          setNodes(draft.nodes);
          if (draft.style) setStyle(draft.style);
          if (draft.background) setBackground(draft.background);
          if (draft.info) setInfo(draft.info);
          if (draft.entryMode) setEntryMode(draft.entryMode);
          if (typeof draft.enabled === "boolean") setEnabled(draft.enabled);
        }
      }
    } catch {
      /* ignore corrupt draft */
    } finally {
      draftReadyRef.current = true;
      // Baseline so hydrate/restore doesn't count as a dirty save.
      queueMicrotask(() => {
        lastSavedJsonRef.current = menuStateJson();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!draftReadyRef.current) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          nodes,
          style,
          background,
          info,
          entryMode,
          enabled,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* quota */
    }
  }, [draftKey, nodes, style, background, info, entryMode, enabled]);

  const historyRef = useRef<HistorySnap[]>([]);
  const futureRef = useRef<HistorySnap[]>([]);
  const skipHistory = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedJsonRef = useRef<string | null>(null);

  const translatingRef = useRef(false);
  const nodesRef = useRef(nodes);
  const infoRef = useRef(info);
  const styleRef = useRef(style);
  const backgroundRef = useRef(background);
  const entryModeRef = useRef(entryMode);
  const enabledRef = useRef(enabled);
  nodesRef.current = nodes;
  infoRef.current = info;
  styleRef.current = style;
  backgroundRef.current = background;
  entryModeRef.current = entryMode;
  enabledRef.current = enabled;

  const menuStateJson = () =>
    JSON.stringify({
      nodes: nodesRef.current,
      style: styleRef.current,
      background: backgroundRef.current,
      info: infoRef.current,
      entryMode: entryModeRef.current,
      enabled: enabledRef.current,
    });

  const snap = useCallback(
    (): HistorySnap => ({ nodes, style, background, info, entryMode, enabled }),
    [nodes, style, background, info, entryMode, enabled],
  );

  const pushHistory = useCallback(() => {
    if (skipHistory.current) return;
    historyRef.current.push(cloneSnap(snap()));
    if (historyRef.current.length > 40) historyRef.current.shift();
    futureRef.current = [];
  }, [snap]);

  const applySnap = (s: HistorySnap) => {
    skipHistory.current = true;
    setNodes(s.nodes);
    setStyle(s.style);
    setBackground(s.background);
    setInfo(s.info);
    setEntryMode(s.entryMode);
    setEnabled(s.enabled);
    queueMicrotask(() => {
      skipHistory.current = false;
    });
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneSnap(snap()));
    applySnap(prev);
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push(cloneSnap(snap()));
    applySnap(next);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  /** Fill missing dish/info copy for the active UI locale when the language toggle changes. */
  useEffect(() => {
    if (translatingRef.current) return;

    const currentNodes = nodesRef.current;
    const currentInfo = infoRef.current;

    type Job = { path: string; from: Locale; text: string };
    const jobs: Job[] = [];

    const consider = (path: string, map: LocaleMap | undefined | null) => {
      if (!map) return;
      const existing = map[locale];
      if (typeof existing === "string" && existing.length > 0) return;
      const source = pickLocaleMapSource(map, locale);
      if (!source || source.locale === locale) return;
      jobs.push({ path, from: source.locale, text: source.text });
    };

    for (const node of currentNodes) {
      const p = node.payload;
      consider(`n:${node.id}:title`, p.title);
      consider(`n:${node.id}:description`, p.description);
      consider(`n:${node.id}:name`, p.name);
      consider(`n:${node.id}:body`, p.body);
      consider(`n:${node.id}:alt`, p.alt);
    }
    consider("i:hours", currentInfo.hours);
    consider("i:address", currentInfo.address);
    consider("i:note", currentInfo.note);

    if (!jobs.length) return;

    translatingRef.current = true;
    showToast(t("menuStudio.translating"));

    void (async () => {
      try {
        const byFrom = new Map<Locale, Job[]>();
        for (const job of jobs) {
          const list = byFrom.get(job.from) ?? [];
          list.push(job);
          byFrom.set(job.from, list);
        }

        const results = new Map<string, string>();
        for (const [from, list] of byFrom) {
          const texts = list.map((j) => j.text);
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts, from, to: locale }),
          });
          if (!res.ok) continue;
          const data = (await res.json()) as { translations?: string[] };
          const translations = data.translations ?? texts;
          list.forEach((job, i) => {
            results.set(job.path, translations[i] ?? job.text);
          });
        }

        if (!results.size) return;

        setNodes((prev) =>
          prev.map((node) => {
            const patch: Partial<MenuNode["payload"]> = {};
            let changed = false;
            const apply = (key: "title" | "description" | "name" | "body" | "alt") => {
              const path = `n:${node.id}:${key}`;
              const text = results.get(path);
              if (text == null) return;
              patch[key] = { ...(node.payload[key] ?? {}), [locale]: text };
              changed = true;
            };
            apply("title");
            apply("description");
            apply("name");
            apply("body");
            apply("alt");
            return changed ? { ...node, payload: { ...node.payload, ...patch } } : node;
          }),
        );

        setInfo((prev) => {
          let next = prev;
          const apply = (key: "hours" | "address" | "note") => {
            const text = results.get(`i:${key}`);
            if (text == null) return;
            next = { ...next, [key]: { ...(next[key] ?? {}), [locale]: text } };
          };
          apply("hours");
          apply("address");
          apply("note");
          return next;
        });
      } finally {
        translatingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const persist = useCallback(async () => {
    const pending = menuStateJson();
    if (lastSavedJsonRef.current !== null && pending === lastSavedJsonRef.current) {
      return;
    }

    setSaveStatus("saving");
    const styleNow = styleRef.current;
    const backgroundNow = backgroundRef.current;
    const infoNow = infoRef.current;
    const entryModeNow = entryModeRef.current;
    const enabledNow = enabledRef.current;

    const { error: mErr } = await supabase
      .from("merchants")
      .update({
        menu_enabled: enabledNow,
        menu_entry_mode: enabledNow
          ? entryModeNow === "off"
            ? "hub"
            : entryModeNow
          : "off",
        menu_style: styleNow,
        menu_background: backgroundNow,
        menu_info: infoNow,
        menu_updated_at: new Date().toISOString(),
      })
      .eq("id", merchant.id);

    if (mErr) {
      console.warn("menu merchant save failed:", mErr.message);
      setSaveStatus("error");
      return;
    }

    const { data: existing, error: listErr } = await supabase
      .from("menu_nodes")
      .select("id")
      .eq("merchant_id", merchant.id);

    if (listErr) {
      console.warn("menu_nodes save skipped:", listErr.message);
      setSaveStatus("error");
      return;
    }

    const ordered = reindexPositions(nodesRef.current);
    const existingIds = new Set((existing ?? []).map((r) => r.id as string));
    const currentIds = new Set(ordered.map((n) => n.id));
    const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
    if (toDelete.length) {
      await supabase.from("menu_nodes").delete().in("id", toDelete);
    }

    for (const n of ordered) {
      const row = {
        id: n.id,
        merchant_id: merchant.id,
        position: n.position,
        type: n.type,
        visible: n.visible,
        section_id: n.section_id,
        payload: n.payload,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("menu_nodes").upsert(row);
      if (error) {
        console.warn("menu_nodes upsert failed:", error.message);
        setSaveStatus("error");
        return;
      }
    }

    lastSavedJsonRef.current = menuStateJson();
    setSaveStatus("saved");
  }, [merchant.id, supabase]);

  useEffect(() => {
    const pending = menuStateJson();
    if (lastSavedJsonRef.current === null) {
      lastSavedJsonRef.current = pending;
      return;
    }
    if (pending === lastSavedJsonRef.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist();
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, style, background, info, entryMode, enabled, persist]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCatalogOpen(false);
        setTab(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, style, background, info, entryMode, enabled]);

  const { roots, itemsBySection } = useMemo(() => groupMenuNodes(nodes), [nodes]);

  const addNode = (type: MenuNodeType, opts?: { withPhoto?: boolean; sectionId?: string | null }) => {
    pushHistory();
    const id = newClientId();
    const sectionId = type === "item" ? (opts?.sectionId ?? null) : null;
    setNodes((prev) => {
      const node: MenuNode = {
        id,
        merchant_id: merchant.id,
        position: prev.length,
        type,
        visible: true,
        section_id: sectionId,
        payload: defaultPayloadForType(type, {
          withPhoto: opts?.withPhoto,
          locale,
          labels: {
            section: t("menuStudio.defaultSection"),
            item: t("menuStudio.defaultItem"),
            heading: t("menuStudio.defaultHeading"),
            text: t("menuStudio.defaultText"),
            scan_page: t("menuStudio.catalogScanPage"),
          },
        }),
      };
      return reindexPositions([...prev, node]);
    });
    setExpandedId(id);
    setCatalogOpen(false);
    setTab("menu");
    if (!enabled) {
      setEnabled(true);
      if (entryMode === "off") setEntryMode("hub");
    }
    showToast(t("menuStudio.added"));
  };

  const updateNode = (id: string, patch: Partial<MenuNode>) => {
    pushHistory();
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const updatePayload = (id: string, patch: Partial<MenuNode["payload"]>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, payload: { ...n.payload, ...patch } } : n)),
    );
  };

  const removeNode = (id: string) => {
    pushHistory();
    setNodes((prev) =>
      reindexPositions(
        prev
          .filter((n) => n.id !== id)
          .map((n) => (n.section_id === id ? { ...n, section_id: null } : n)),
      ),
    );
    showToast(t("menuStudio.deleted"));
  };

  const moveNode = (id: string, dir: -1 | 1) => {
    pushHistory();
    setNodes((prev) => {
      const node = prev.find((n) => n.id === id);
      if (!node) return prev;
      const inSection = node.type === "item" && Boolean(node.section_id);
      const sorted = sortMenuNodes(prev);
      const siblings = sorted.filter((n) =>
        inSection
          ? n.type === "item" && n.section_id === node.section_id
          : !(n.type === "item" && n.section_id),
      );
      const idx = siblings.findIndex((n) => n.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= siblings.length) return prev;

      const reordered = [...siblings];
      [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
      const queue = [...reordered];
      const next = sorted.map((n) => {
        const isSibling = inSection
          ? n.type === "item" && n.section_id === node.section_id
          : !(n.type === "item" && n.section_id);
        return isSibling ? queue.shift()! : n;
      });
      return reindexPositions(next);
    });
  };

  const uploadFile = async (
    file: File,
    kind: "image" | "video" = "image",
    quality: "default" | "high" = "default",
  ) => {
    const prepared =
      kind === "image"
        ? await compressImageForUpload(
            file,
            quality === "high" ? MENU_BG_IMAGE_COMPRESS : undefined,
          ).catch(() => file)
        : file;

    // Prefer direct browser → Supabase upload (avoids host body-size limits on videos).
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const nameLower = prepared.name.toLowerCase();
      const ext =
        prepared.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
        (kind === "video"
          ? nameLower.includes("webm")
            ? "webm"
            : nameLower.includes("mov")
              ? "mov"
              : "mp4"
          : "jpg");
      const contentType =
        prepared.type ||
        (kind === "video"
          ? ext === "webm"
            ? "video/webm"
            : ext === "mov"
              ? "video/quicktime"
              : "video/mp4"
          : "image/jpeg");
      const path = `${user.id}/${merchant.id}/menu-${crypto.randomUUID()}.${ext}`;

      for (const bucket of ["menu-media", "merchant-logos"] as const) {
        const { error } = await supabase.storage.from(bucket).upload(path, prepared, {
          contentType,
          upsert: false,
        });
        if (!error) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          return data.publicUrl;
        }
      }
    }

    // Fallback: API route (service role when configured).
    const body = new FormData();
    body.append("file", prepared);
    body.append("kind", kind);
    const res = await fetch("/api/menu/upload", { method: "POST", body });
    const data = (await res.json()) as { url?: string; error?: string; detail?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.detail || data.error || "upload");
    }
    return data.url;
  };

  const pickImageWithCrop = (onDone: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setCropJob({ file, onDone });
    };
    input.click();
  };

  /** Open the cropper on an already-uploaded image (pencil = adjust, not replace). */
  const cropExistingImage = (imageUrl: string, onDone: (file: File) => void) => {
    void (async () => {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error("fetch");
        const blob = await res.blob();
        const name =
          imageUrl.split("/").pop()?.split("?")[0] ||
          (blob.type.includes("png") ? "image.png" : "image.jpg");
        const file = new File([blob], name, { type: blob.type || "image/jpeg" });
        setCropJob({ file, onDone });
      } catch {
        showToast(t("menuStudio.uploadFailed"));
      }
    })();
  };

  const setLocaleField = (map: LocaleMap | undefined, value: string): LocaleMap => ({
    ...(map ?? {}),
    [locale]: value,
  });

  const filteredCatalog = MENU_CATALOG.filter((c) => {
    if (!catalogQuery.trim()) return true;
    return t(c.labelKey).toLowerCase().includes(catalogQuery.toLowerCase());
  });

  const toggleTab = (next: StudioTab) => {
    if (tab === next) {
      setTab(null);
    } else {
      setTab(next);
    }
  };

  const studioRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(56);

  // Pin studio under the dashboard header using the visual viewport (iOS-safe).
  useEffect(() => {
    const navWrap = document.querySelector(".brutal-nav-wrap") as HTMLElement | null;
    let lastTop = -1;
    let lastHeight = -1;
    let raf = 0;

    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const top = Math.round(navWrap?.getBoundingClientRect().bottom ?? 56);
        const layoutBottom = vv
          ? Math.round(vv.offsetTop + vv.height)
          : Math.round(window.innerHeight);
        const height = Math.max(200, layoutBottom - top);
        if (top === lastTop && height === lastHeight) return;
        lastTop = top;
        lastHeight = height;
        document.documentElement.style.setProperty("--menu-studio-top", `${top}px`);
        document.documentElement.style.setProperty("--menu-studio-height", `${height}px`);
      });
    };

    sync();
    const ro = navWrap ? new ResizeObserver(sync) : null;
    if (navWrap) ro?.observe(navWrap);
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--menu-studio-top");
      document.documentElement.style.removeProperty("--menu-studio-height");
    };
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const sync = () => setNavHeight(el.offsetHeight);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  const prevNodeCountRef = useRef(nodes.length);

  useEffect(() => {
    if (nodes.length > prevNodeCountRef.current) {
      const el = previewScrollRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        });
      }
    }
    prevNodeCountRef.current = nodes.length;
  }, [nodes.length]);

  useEffect(() => {
    if (style.font) void ensureQRFontLoaded(style.font, "name");
  }, [style.font]);

  return (
    <div
      ref={studioRef}
      className="menu-studio relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f3eee6]"
    >
      <header
        ref={headerRef}
        className="z-30 flex w-full shrink-0 justify-center border-b border-black/10 bg-[#f3eee6] px-3 py-2"
      >
        <div className="relative flex w-full max-w-lg items-center">
          <div className="flex rounded-2xl bg-black/5 p-1 text-xs font-semibold uppercase tracking-wide">
            <button
              type="button"
              className={`menu-press rounded-xl px-3 py-1.5 ${mode === "edit" ? "bg-white" : ""}`}
              onClick={() => setMode("edit")}
            >
              {t("menuStudio.edit")}
            </button>
            <button
              type="button"
              className={`menu-press rounded-xl px-3 py-1.5 ${mode === "preview" ? "bg-white" : ""}`}
              onClick={() => {
                setMode("preview");
                setTab(null);
                setCatalogOpen(false);
              }}
            >
              {t("menuStudio.preview")}
            </button>
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                disabled={historyRef.current.length === 0}
                aria-label={t("menuStudio.undo")}
                title={t("menuStudio.undo")}
                className={`${ui.btnOutline} menu-press flex h-9 w-9 items-center justify-center !p-0 disabled:opacity-40`}
                onClick={undo}
              >
                <UndoIcon />
              </button>
              <button
                type="button"
                disabled={futureRef.current.length === 0}
                aria-label={t("menuStudio.redo")}
                title={t("menuStudio.redo")}
                className={`${ui.btnOutline} menu-press flex h-9 w-9 items-center justify-center !p-0 disabled:opacity-40`}
                onClick={redo}
              >
                <RedoIcon />
              </button>
            </div>
          </div>
          <span
            className={`ml-auto inline-flex min-w-[4.5rem] shrink-0 items-center justify-end gap-1 text-xs font-semibold ${
              saveStatus === "saved"
                ? "text-emerald-600"
                : saveStatus === "error"
                  ? "text-red-600"
                  : "text-zinc-500"
            }`}
          >
            {saveStatus === "saving"
              ? t("menuStudio.saving")
              : saveStatus === "saved"
                ? (
                  <>
                    <span aria-hidden>✓</span>
                    {t("menuStudio.saved")}
                  </>
                )
                : saveStatus === "error"
                  ? t("menuStudio.saveError")
                  : null}
          </span>
        </div>
      </header>

      <div
        ref={previewScrollRef}
        className="menu-studio-preview relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-3 [-webkit-overflow-scrolling:touch]"
      >
        <div
          className="mx-auto w-full max-w-[430px] overflow-x-hidden rounded-[1.25rem] border border-black/10 shadow-sm"
          style={{ backgroundColor: background.color || DEFAULT_MENU_BACKGROUND.color }}
        >
          <MenuPublicView
            merchantName={merchant.name}
            logoUrl={merchant.logo_url}
            primaryColor={merchant.primary_color}
            nodes={nodes}
            style={style}
            background={background}
            info={info}
            locale={locale}
          />
        </div>
      </div>

      {mode === "edit" ? (
        <DockSheet
          open={tab !== null}
          onClose={() => setTab(null)}
          bottomOffset={navHeight}
          ariaLabel={t("menuStudio.resizeSheet")}
        >

            {tab === "menu" ? (
              <MenuSheet
                roots={roots}
                itemsBySection={itemsBySection}
                locale={locale}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                onAdd={() => setCatalogOpen(true)}
                onAddItemToSection={(sectionId) => addNode("item", { sectionId })}
                onToggleVisible={(id, visible) => updateNode(id, { visible })}
                onRemove={removeNode}
                onMove={moveNode}
                onUpdatePayload={updatePayload}
                setLocaleField={setLocaleField}
                uploadFile={uploadFile}
                pickImageWithCrop={pickImageWithCrop}
                cropExistingImage={cropExistingImage}
                t={t}
                showToast={showToast}
              />
            ) : null}
            {tab === "info" ? (
              <InfoSheet info={info} setInfo={(next) => { pushHistory(); setInfo(next); }} locale={locale} t={t} setLocaleField={setLocaleField} />
            ) : null}
            {tab === "style" ? (
              <StyleSheet style={style} setStyle={(next) => { pushHistory(); setStyle(next); }} t={t} />
            ) : null}
            {tab === "background" ? (
              <BackgroundSheet
                background={background}
                setBackground={(next) => { pushHistory(); setBackground(next); }}
                pickImageWithCrop={pickImageWithCrop}
                cropExistingImage={cropExistingImage}
                uploadFile={uploadFile}
                t={t}
                showToast={showToast}
              />
            ) : null}
            {tab === "share" ? (
              <ShareSheet
                enabled={enabled}
                entryMode={entryMode}
                slug={merchant.slug}
                setEnabled={(v) => {
                  pushHistory();
                  setEnabled(v);
                  if (v && entryMode === "off") setEntryMode("hub");
                  if (!v) setEntryMode("off");
                }}
                setEntryMode={(v) => {
                  pushHistory();
                  setEntryMode(v);
                  if (v !== "off") setEnabled(true);
                }}
                t={t}
              />
            ) : null}
        </DockSheet>
      ) : null}

      {mode === "edit" ? (
        <nav
          ref={navRef}
          className="menu-studio-tabbar relative z-[60] shrink-0 border-t border-black/10 bg-[#f3eee6] px-2 pt-1.5"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
            {(
              [
                ["menu", "menuStudio.tabMenu"],
                ["info", "menuStudio.tabInfo"],
                ["style", "menuStudio.tabStyle"],
                ["background", "menuStudio.tabBackground"],
                ["share", "menuStudio.tabShare"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleTab(id)}
                className={`menu-press rounded-xl px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide ${
                  tab === id ? "bg-black text-white" : "text-zinc-700"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </nav>
      ) : null}

      {catalogOpen ? (
        <div className="absolute inset-x-0 bottom-0 z-[80] mx-auto flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-lg">
          <div className="flex shrink-0 items-center gap-2 border-b border-black/5 px-4 py-3">
            <input
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
              placeholder={t("menuStudio.searchCatalog")}
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              autoFocus
            />
            <button type="button" className="text-sm font-medium" onClick={() => setCatalogOpen(false)}>
              {t("menuStudio.close")}
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {(["structure", "dishes", "media"] as const).map((group) => {
              const items = filteredCatalog.filter((c) => c.group === group);
              if (!items.length) return null;
              return (
                <div key={group}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    {t(`menuStudio.group${group[0].toUpperCase()}${group.slice(1)}`)}
                  </p>
                  <div className="grid gap-2">
                    {items.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="menu-press rounded-2xl border border-black/10 px-3 py-3 text-left text-sm font-medium transition"
                        onClick={() => {
                          if (c.type === "scan_page" || c.type === "image") {
                            pickImageWithCrop(async (file) => {
                              try {
                                const url = await uploadFile(file, "image");
                                pushHistory();
                                const id = newClientId();
                                setNodes((prev) => [
                                  ...prev,
                                  {
                                    id,
                                    merchant_id: merchant.id,
                                    position: prev.length,
                                    type: c.type,
                                    visible: true,
                                    section_id: null,
                                    payload: {
                                      ...defaultPayloadForType(c.type, {
                                        locale,
                                        labels: { scan_page: t("menuStudio.catalogScanPage") },
                                      }),
                                      image_url: url,
                                    },
                                  },
                                ]);
                                setExpandedId(id);
                                setCatalogOpen(false);
                                setTab("menu");
                                if (!enabled) {
                                  setEnabled(true);
                                  if (entryMode === "off") setEntryMode("hub");
                                }
                                showToast(t("menuStudio.added"));
                              } catch {
                                showToast(t("menuStudio.uploadFailed"));
                              }
                            });
                            return;
                          }
                          addNode(c.type, { withPhoto: c.withPhoto });
                        }}
                      >
                        {t(c.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="border-t border-black/5 pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {t("menuStudio.importTitle")}
              </p>
              <label className="flex cursor-pointer flex-col gap-1 rounded-xl border border-dashed border-black/20 px-3 py-4 text-sm hover:bg-black/[0.02]">
                <span className="font-medium">{t("menuStudio.importScan")}</span>
                <span className="text-xs text-zinc-500">{t("menuStudio.importScanHint")}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = [...(e.target.files ?? [])];
                    e.target.value = "";
                    for (const file of files) {
                      try {
                        if (file.type === "application/pdf") {
                          const pages = await rasterizePdfPages(file);
                          for (const blob of pages) {
                            const pageFile = new File([blob], "page.png", { type: "image/png" });
                            const url = await uploadFile(pageFile, "image");
                            pushHistory();
                            setNodes((prev) => [
                              ...prev,
                              {
                                id: newClientId(),
                                merchant_id: merchant.id,
                                position: prev.length,
                                type: "scan_page",
                                visible: true,
                                section_id: null,
                                payload: {
                                  image_url: url,
                                  alt: emptyLocaleMap(t("menuStudio.catalogScanPage"), locale),
                                },
                              },
                            ]);
                          }
                        } else {
                          const url = await uploadFile(file, "image");
                          pushHistory();
                          setNodes((prev) => [
                            ...prev,
                            {
                              id: newClientId(),
                              merchant_id: merchant.id,
                              position: prev.length,
                              type: "scan_page",
                              visible: true,
                              section_id: null,
                              payload: {
                                image_url: url,
                                alt: emptyLocaleMap(t("menuStudio.catalogScanPage"), locale),
                              },
                            },
                          ]);
                        }
                        if (!enabled) {
                          setEnabled(true);
                          if (entryMode === "off") setEntryMode("hub");
                        }
                        showToast(t("menuStudio.added"));
                      } catch {
                        showToast(t("menuStudio.uploadFailed"));
                      }
                    }
                    setCatalogOpen(false);
                    setTab("menu");
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white">
          {toast}
        </div>
      ) : null}

      {cropJob ? (
        <MenuMediaCropper
          file={cropJob.file}
          title={t("menuStudio.cropTitle")}
          confirmLabel={t("menuStudio.cropConfirm")}
          cancelLabel={t("menuStudio.close")}
          onCancel={() => setCropJob(null)}
          onConfirm={(file) => {
            const done = cropJob.onDone;
            setCropJob(null);
            done(file);
          }}
        />
      ) : null}
    </div>
  );
}

function MenuSheet(props: {
  roots: MenuNode[];
  itemsBySection: Record<string, MenuNode[]>;
  locale: string;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onAdd: () => void;
  onAddItemToSection: (sectionId: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onUpdatePayload: (id: string, patch: Partial<MenuNode["payload"]>) => void;
  setLocaleField: (map: LocaleMap | undefined, value: string) => LocaleMap;
  uploadFile: (file: File, kind?: "image" | "video") => Promise<string>;
  pickImageWithCrop: (onDone: (file: File) => void) => void;
  cropExistingImage: (imageUrl: string, onDone: (file: File) => void) => void;
  t: (k: string) => string;
  showToast: (msg: string) => void;
}) {
  const {
    roots,
    itemsBySection,
    locale,
    expandedId,
    setExpandedId,
    onAdd,
    onAddItemToSection,
    onToggleVisible,
    onRemove,
    onMove,
    onUpdatePayload,
    setLocaleField,
    uploadFile,
    pickImageWithCrop,
    cropExistingImage,
    t,
    showToast,
  } = props;

  if (!roots.length) {
    return (
      <div className="space-y-4 py-6 text-center">
        <p className="text-sm text-zinc-600">{t("menuStudio.empty")}</p>
        <button
          type="button"
          className="menu-press rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
          onClick={onAdd}
        >
          {t("menuStudio.add")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 pb-1">
        <h2 className="text-sm font-bold uppercase tracking-wide">{t("menuStudio.tabMenu")}</h2>
        <button
          type="button"
          className="menu-press shrink-0 rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold leading-none text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd();
          }}
        >
          {t("menuStudio.add")}
        </button>
      </div>
      {roots.map((node) => (
        <div key={node.id}>
          <NodeRow
            node={node}
            locale={locale}
            expanded={expandedId === node.id}
            onToggleExpand={() => setExpandedId(expandedId === node.id ? null : node.id)}
            onToggleVisible={onToggleVisible}
            onRemove={onRemove}
            onMove={onMove}
            onUpdatePayload={onUpdatePayload}
            setLocaleField={setLocaleField}
            uploadFile={uploadFile}
            pickImageWithCrop={pickImageWithCrop}
            cropExistingImage={cropExistingImage}
            onAddItemToSection={onAddItemToSection}
            t={t}
            showToast={showToast}
          />
          {node.type === "section" ? (
            <div className="ml-3 mt-2 space-y-2 border-l-2 border-black/10 pl-3">
              {(itemsBySection[node.id] ?? []).map((item) => (
                <NodeRow
                  key={item.id}
                  node={item}
                  locale={locale}
                  expanded={expandedId === item.id}
                  onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onToggleVisible={onToggleVisible}
                  onRemove={onRemove}
                  onMove={onMove}
                  onUpdatePayload={onUpdatePayload}
                  setLocaleField={setLocaleField}
                  uploadFile={uploadFile}
                  pickImageWithCrop={pickImageWithCrop}
                  cropExistingImage={cropExistingImage}
                  t={t}
                  showToast={showToast}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function NodeRow({
  node,
  locale,
  expanded,
  onToggleExpand,
  onToggleVisible,
  onRemove,
  onMove,
  onUpdatePayload,
  setLocaleField,
  uploadFile,
  pickImageWithCrop,
  cropExistingImage,
  onAddItemToSection,
  t,
  showToast,
}: {
  node: MenuNode;
  locale: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onUpdatePayload: (id: string, patch: Partial<MenuNode["payload"]>) => void;
  setLocaleField: (map: LocaleMap | undefined, value: string) => LocaleMap;
  uploadFile: (file: File, kind?: "image" | "video") => Promise<string>;
  pickImageWithCrop: (onDone: (file: File) => void) => void;
  cropExistingImage: (imageUrl: string, onDone: (file: File) => void) => void;
  onAddItemToSection?: (sectionId: string) => void;
  t: (k: string) => string;
  showToast?: (msg: string) => void;
}) {
  const label =
    resolveLocaleMap(node.payload.name ?? node.payload.title ?? node.payload.body, locale as never) ||
    t(`menuStudio.type_${node.type}`);

  const currencyId =
    MENU_CURRENCIES.find((c) => c.id === node.payload.currency || c.symbol === node.payload.currency)?.id ??
    "EUR";

  return (
    <div className="rounded-2xl border border-black/10 bg-zinc-50">
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          className="menu-press min-w-0 flex-1 truncate rounded-xl px-1 py-2 text-left text-sm font-medium"
          onClick={onToggleExpand}
        >
          <span className="mr-2 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            {t(`menuStudio.type_${node.type}`)}
          </span>
          {label}
        </button>
        <button
          type="button"
          className="menu-press flex h-10 w-10 items-center justify-center rounded-xl text-base"
          onClick={() => onMove(node.id, -1)}
          aria-label={t("menuStudio.moveUp")}
        >
          ↑
        </button>
        <button
          type="button"
          className="menu-press flex h-10 w-10 items-center justify-center rounded-xl text-base"
          onClick={() => onMove(node.id, 1)}
          aria-label={t("menuStudio.moveDown")}
        >
          ↓
        </button>
        <button
          type="button"
          className="menu-press flex h-10 w-10 items-center justify-center rounded-xl text-base"
          onClick={() => onToggleVisible(node.id, !node.visible)}
          title={t("menuStudio.visibility")}
          aria-label={t("menuStudio.visibility")}
        >
          {node.visible ? "●" : "○"}
        </button>
        <button
          type="button"
          className="menu-press flex h-10 w-10 items-center justify-center rounded-xl text-lg text-red-600"
          onClick={() => onRemove(node.id)}
          aria-label={t("menuStudio.delete")}
        >
          ×
        </button>
      </div>
      {expanded ? (
        <div className="space-y-3 border-t border-black/5 px-3 py-3">
          {node.type === "section" || node.type === "heading" ? (
            <>
              <Field
                label={t("menuStudio.fieldTitle")}
                value={localeMapDraft(node.payload.title, locale as never)}
                onChange={(v) => onUpdatePayload(node.id, { title: setLocaleField(node.payload.title, v) })}
              />
              {node.type === "section" ? (
                <>
                  <Field
                    label={t("menuStudio.fieldDescription")}
                    value={localeMapDraft(node.payload.description, locale as never)}
                    onChange={(v) =>
                      onUpdatePayload(node.id, { description: setLocaleField(node.payload.description, v) })
                    }
                  />
                  {onAddItemToSection ? (
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold hover:bg-[var(--c-cream)]"
                      onClick={() => onAddItemToSection(node.id)}
                    >
                      {t("menuStudio.addItem")}
                    </button>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          {node.type === "text" ? (
            <Field
              label={t("menuStudio.fieldText")}
              value={localeMapDraft(node.payload.body, locale as never)}
              onChange={(v) => onUpdatePayload(node.id, { body: setLocaleField(node.payload.body, v) })}
            />
          ) : null}
          {node.type === "item" ? (
            <>
              <Field
                label={t("menuStudio.fieldName")}
                value={localeMapDraft(node.payload.name, locale as never)}
                onChange={(v) => onUpdatePayload(node.id, { name: setLocaleField(node.payload.name, v) })}
              />
              <Field
                label={t("menuStudio.fieldDescription")}
                value={localeMapDraft(node.payload.description, locale as never)}
                onChange={(v) =>
                  onUpdatePayload(node.id, { description: setLocaleField(node.payload.description, v) })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label={t("menuStudio.fieldPrice")}
                  value={node.payload.price ?? ""}
                  onChange={(v) => onUpdatePayload(node.id, { price: v })}
                />
                <MenuSelect
                  label={t("menuStudio.fieldCurrency")}
                  value={currencyId}
                  options={MENU_CURRENCIES.map((c) => ({
                    value: c.id,
                    label: `${c.symbol} · ${t(c.labelKey)}`,
                  }))}
                  onChange={(v) => onUpdatePayload(node.id, { currency: v })}
                />
              </div>
              <Field
                label={t("menuStudio.fieldTags")}
                value={(node.payload.tags ?? []).join(", ")}
                onChange={(v) =>
                  onUpdatePayload(node.id, {
                    tags: v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
              <MediaEditors
                node={node}
                onUpdatePayload={onUpdatePayload}
                uploadFile={uploadFile}
                cropExistingImage={cropExistingImage}
                t={t}
                showToast={showToast}
              />
            </>
          ) : null}
          {node.type === "image" || node.type === "scan_page" ? (
            node.payload.image_url ? (
              <div className="relative overflow-hidden rounded-2xl border border-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={node.payload.image_url} alt="" className="aspect-video w-full object-cover" />
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    type="button"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-sm"
                    aria-label={t("menuStudio.editMedia")}
                    onClick={() =>
                      cropExistingImage(node.payload.image_url!, async (file) => {
                        try {
                          const url = await uploadFile(file, "image");
                          onUpdatePayload(node.id, { image_url: url });
                        } catch {
                          /* ignore */
                        }
                      })
                    }
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-sm text-red-600"
                    aria-label={t("menuStudio.delete")}
                    onClick={() => onUpdatePayload(node.id, { image_url: null })}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="w-full cursor-pointer rounded-2xl border border-dashed border-black/20 bg-white px-3 py-4 text-sm font-semibold hover:bg-[var(--c-cream)]"
                onClick={() =>
                  pickImageWithCrop(async (file) => {
                    try {
                      const url = await uploadFile(file, "image");
                      onUpdatePayload(node.id, { image_url: url });
                    } catch {
                      /* ignore */
                    }
                  })
                }
              >
                {t("menuStudio.fieldImage")}
              </button>
            )
          ) : null}
          {node.type === "gallery" ? (
            <button
              type="button"
              className="w-full rounded-2xl border border-dashed border-black/20 bg-white px-3 py-4 text-sm font-semibold hover:bg-[var(--c-cream)]"
              onClick={() =>
                pickImageWithCrop(async (file) => {
                  try {
                    const url = await uploadFile(file, "image");
                    onUpdatePayload(node.id, {
                      image_urls: [...(node.payload.image_urls ?? []), url],
                    });
                  } catch {
                    /* ignore */
                  }
                })
              }
            >
              {t("menuStudio.fieldGallery")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MediaEditors({
  node,
  onUpdatePayload,
  uploadFile,
  cropExistingImage,
  t,
  showToast,
}: {
  node: MenuNode;
  onUpdatePayload: (id: string, patch: Partial<MenuNode["payload"]>) => void;
  uploadFile: (file: File, kind?: "image" | "video") => Promise<string>;
  cropExistingImage: (imageUrl: string, onDone: (file: File) => void) => void;
  t: (k: string) => string;
  showToast?: (msg: string) => void;
}) {
  const photos = node.payload.photo_urls ?? [];
  const videoUrl = node.payload.video_url ?? null;
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fail = (msg: string) => {
    if (showToast) showToast(msg);
    else alert(msg);
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = [...fileList];
    if (!files.length) return;
    setBusy(true);
    let uploadedAny = false;
    try {
      let nextPhotos = [...photos];
      let nextVideo = videoUrl;
      let nextAspect = node.payload.video_aspect ?? null;

      for (const file of files) {
        const isVideo = isMenuVideoFile(file);
        if (isVideo) {
          if (nextVideo) {
            fail(t("menuStudio.videoReady"));
            continue;
          }
          const check = await validateMenuVideoFile(file);
          if (!check.ok) {
            fail(t(`menuStudio.${check.error}`));
            continue;
          }
          try {
            nextVideo = await uploadFile(file, "video");
            nextAspect = check.aspect;
            uploadedAny = true;
          } catch {
            fail(t("menuStudio.uploadFailed"));
          }
          continue;
        }
        if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name)) {
          fail(t("menuStudio.uploadFailed"));
          continue;
        }
        if (nextPhotos.length >= MAX_DISH_PHOTOS) continue;
        try {
          const url = await uploadFile(file, "image");
          nextPhotos = [...nextPhotos, url].slice(0, MAX_DISH_PHOTOS);
          uploadedAny = true;
        } catch {
          fail(t("menuStudio.uploadFailed"));
        }
      }

      if (uploadedAny) {
        onUpdatePayload(node.id, {
          photo_urls: nextPhotos,
          video_url: nextVideo,
          video_aspect: nextAspect,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const canAddMore = photos.length < MAX_DISH_PHOTOS || !videoUrl;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold">
        {t("menuStudio.mediaLabel")} · {t("menuStudio.photos")} {photos.length}/{MAX_DISH_PHOTOS} ·{" "}
        {t("menuStudio.videoCount")} {videoUrl ? 1 : 0}/1
      </p>

      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-2xl border border-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-1">
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 text-sm"
                aria-label={t("menuStudio.editMedia")}
                onClick={() =>
                  cropExistingImage(url, async (cropped) => {
                    try {
                      const next = await uploadFile(cropped, "image");
                      onUpdatePayload(node.id, {
                        photo_urls: photos.map((p) => (p === url ? next : p)),
                      });
                    } catch {
                      /* ignore */
                    }
                  })
                }
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 text-sm text-red-600"
                aria-label={t("menuStudio.delete")}
                onClick={() =>
                  onUpdatePayload(node.id, { photo_urls: photos.filter((p) => p !== url) })
                }
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}

        {videoUrl ? (
          <div className="relative h-20 w-28 overflow-hidden rounded-2xl border border-black/10 bg-black">
            <video
              src={videoUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              onLoadedMetadata={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.volume = 0;
              }}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-1">
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/95 text-sm text-red-600"
                aria-label={t("menuStudio.delete")}
                onClick={() =>
                  onUpdatePayload(node.id, { video_url: null, video_aspect: null })
                }
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {canAddMore ? (
        <div
          className={`relative mx-0 flex min-h-[7rem] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-4 py-6 text-center text-sm transition ${
            dragging
              ? "border-black bg-[var(--c-cream)]"
              : "border-black/25 bg-zinc-50 hover:bg-[var(--c-cream)]"
          } ${busy ? "pointer-events-none opacity-70" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void processFiles(e.dataTransfer.files);
          }}
        >
          <span className="pointer-events-none font-semibold">
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                {t("menuStudio.uploading")}
              </span>
            ) : (
              t("menuStudio.dropMedia")
            )}
          </span>
          <span className="pointer-events-none mt-1 text-[11px] text-zinc-500">
            {t("menuStudio.dropMediaHint")}
          </span>
          <input
            type="file"
            accept="image/*,video/*,.mp4,.webm,.mov,.m4v"
            multiple
            disabled={busy}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label={t("menuStudio.dropMedia")}
            onChange={(e) => {
              const files = e.target.files;
              e.target.value = "";
              if (files) void processFiles(files);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-semibold">{label}</span>
      <input
        className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black/25"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function InfoSheet({
  info,
  setInfo,
  locale,
  t,
  setLocaleField,
}: {
  info: MenuInfo;
  setInfo: (i: MenuInfo) => void;
  locale: string;
  t: (k: string) => string;
  setLocaleField: (map: LocaleMap | undefined, value: string) => LocaleMap;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide">{t("menuStudio.tabInfo")}</h2>
      <Field
        label={t("menuStudio.fieldHours")}
        value={localeMapDraft(info.hours, locale as never)}
        onChange={(v) => setInfo({ ...info, hours: setLocaleField(info.hours, v) })}
      />
      <Field
        label={t("menuStudio.fieldAddress")}
        value={localeMapDraft(info.address, locale as never)}
        onChange={(v) => setInfo({ ...info, address: setLocaleField(info.address, v) })}
      />
      <Field
        label={t("menuStudio.fieldNote")}
        value={localeMapDraft(info.note, locale as never)}
        onChange={(v) => setInfo({ ...info, note: setLocaleField(info.note, v) })}
      />
    </div>
  );
}

function StyleSheet({
  style,
  setStyle,
  t,
}: {
  style: MenuStyle;
  setStyle: (s: MenuStyle) => void;
  t: (k: string) => string;
}) {
  const s = { ...DEFAULT_MENU_STYLE, ...style };
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide">{t("menuStudio.tabStyle")}</h2>
      <MenuColorField
        label={t("menuStudio.accent")}
        value={s.accent || DEFAULT_MENU_STYLE.accent}
        fallback={DEFAULT_MENU_STYLE.accent}
        onChange={(accent) => setStyle({ ...s, accent })}
      />
      <MenuColorField
        label={t("menuStudio.nameColor")}
        value={s.nameColor || DEFAULT_MENU_STYLE.nameColor}
        fallback={DEFAULT_MENU_STYLE.nameColor}
        onChange={(nameColor) => setStyle({ ...s, nameColor })}
      />
      <MenuColorField
        label={t("menuStudio.textColor")}
        value={s.textColor || DEFAULT_MENU_STYLE.textColor}
        fallback={DEFAULT_MENU_STYLE.textColor}
        onChange={(textColor) => setStyle({ ...s, textColor })}
      />
      <MenuSelect
        label={t("menuStudio.density")}
        value={s.density || "comfortable"}
        options={[
          { value: "comfortable", label: t("menuStudio.densityComfortable") },
          { value: "compact", label: t("menuStudio.densityCompact") },
        ]}
        onChange={(v) => setStyle({ ...s, density: v as MenuStyle["density"] })}
      />
      <MenuSelect
        label={t("menuStudio.priceAlign")}
        value={s.priceAlign || "right"}
        options={[
          { value: "right", label: t("menuStudio.priceRight") },
          { value: "inline", label: t("menuStudio.priceInline") },
        ]}
        onChange={(v) => setStyle({ ...s, priceAlign: v as MenuStyle["priceAlign"] })}
      />
      <MenuSelect
        label={t("menuStudio.corners")}
        value={s.corners || "rounded"}
        options={[
          { value: "rounded", label: t("menuStudio.cornersRounded") },
          { value: "sharp", label: t("menuStudio.cornersSharp") },
        ]}
        onChange={(v) => setStyle({ ...s, corners: v as MenuStyle["corners"] })}
      />
      <QRFontPicker
        id="menu-font"
        label={t("menuStudio.font")}
        value={s.font || DEFAULT_MENU_STYLE.font}
        onChange={(font) => {
          void ensureQRFontLoaded(font, "name");
          setStyle({ ...s, font });
        }}
      />
    </div>
  );
}

function BackgroundSheet({
  background,
  setBackground,
  uploadFile,
  pickImageWithCrop,
  cropExistingImage,
  t,
  showToast,
}: {
  background: MenuBackground;
  setBackground: (b: MenuBackground) => void;
  uploadFile: (
    file: File,
    kind?: "image" | "video",
    quality?: "default" | "high",
  ) => Promise<string>;
  pickImageWithCrop: (onDone: (file: File) => void) => void;
  cropExistingImage: (imageUrl: string, onDone: (file: File) => void) => void;
  t: (k: string) => string;
  showToast: (msg: string) => void;
}) {
  const color = background.color || DEFAULT_MENU_BACKGROUND.color;
  const bannerUrl = background.bannerUrl ?? background.imageUrl ?? null;
  const pageImageUrl = background.pageImageUrl ?? null;

  const pickPageImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void (async () => {
        try {
          const url = await uploadFile(file, "image", "high");
          setBackground({ ...background, pageImageUrl: url });
        } catch {
          showToast(t("menuStudio.uploadFailed"));
        }
      })();
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide">{t("menuStudio.tabBackground")}</h2>
      <MenuColorField
        label={t("menuStudio.bgColor")}
        value={color}
        fallback={DEFAULT_MENU_BACKGROUND.color}
        onChange={(next) => setBackground({ ...background, color: next })}
      />

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-zinc-700">
          {t("menuStudio.bgImage")}
        </span>
        <p className="mb-2 text-xs text-zinc-500">{t("menuStudio.bgImageHint")}</p>
        {pageImageUrl ? (
          <div className="relative mb-2 overflow-hidden rounded-2xl border border-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pageImageUrl} alt="" className="aspect-[9/16] max-h-56 w-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-sm shadow"
                aria-label={t("menuStudio.editMedia")}
                onClick={() =>
                  cropExistingImage(pageImageUrl, async (file) => {
                    try {
                      const url = await uploadFile(file, "image", "high");
                      setBackground({ ...background, pageImageUrl: url });
                    } catch {
                      showToast(t("menuStudio.uploadFailed"));
                    }
                  })
                }
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-sm text-red-600 shadow"
                aria-label={t("menuStudio.removeBgImage")}
                onClick={() => setBackground({ ...background, pageImageUrl: null })}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-zinc-50 px-3 py-6 text-sm transition hover:bg-[var(--c-cream)]"
            onClick={pickPageImage}
          >
            <span className="font-semibold">{t("menuStudio.uploadBgImage")}</span>
          </button>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-zinc-700">
          {t("menuStudio.banner")}
        </span>
        <p className="mb-2 text-xs text-zinc-500">{t("menuStudio.bannerHint")}</p>
        {bannerUrl ? (
          <div className="relative mb-2 overflow-hidden rounded-2xl border border-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="" className="aspect-[16/9] w-full object-cover" />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
              style={{
                background: `linear-gradient(to bottom, transparent, ${color})`,
              }}
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-sm shadow"
                aria-label={t("menuStudio.editMedia")}
                onClick={() =>
                  cropExistingImage(bannerUrl, async (file) => {
                    try {
                      const url = await uploadFile(file, "image");
                      setBackground({ ...background, bannerUrl: url, imageUrl: url });
                    } catch {
                      showToast(t("menuStudio.uploadFailed"));
                    }
                  })
                }
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/95 text-sm text-red-600 shadow"
                aria-label={t("menuStudio.delete")}
                onClick={() => setBackground({ ...background, bannerUrl: null, imageUrl: null })}
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-zinc-50 px-3 py-6 text-sm transition hover:bg-[var(--c-cream)]"
            onClick={() =>
              pickImageWithCrop(async (file) => {
                try {
                  const url = await uploadFile(file, "image");
                  setBackground({ ...background, bannerUrl: url, imageUrl: url });
                } catch {
                  showToast(t("menuStudio.uploadFailed"));
                }
              })
            }
          >
            <span className="font-semibold">{t("menuStudio.uploadBanner")}</span>
          </button>
        )}
      </div>
    </div>
  );
}


function ShareSheet({
  enabled,
  entryMode,
  slug,
  setEnabled,
  setEntryMode,
  t,
}: {
  enabled: boolean;
  entryMode: MenuEntryMode;
  slug: string;
  setEnabled: (v: boolean) => void;
  setEntryMode: (v: MenuEntryMode) => void;
  t: (k: string) => string;
}) {
  const mode = enabled ? (entryMode === "off" ? "hub" : entryMode) : "off";
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide">{t("menuStudio.tabShare")}</h2>
      <p className="text-sm text-zinc-600">{t("menuStudio.shareHint")}</p>
      <div className="grid gap-2">
        {(
          [
            ["off", "menuStudio.modeOff"],
            ["hub", "menuStudio.modeHub"],
            ["separate", "menuStudio.modeSeparate"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-xl border px-3 py-3 text-left text-sm ${
              mode === id ? "border-black bg-black text-white" : "border-black/10"
            }`}
            onClick={() => {
              if (id === "off") setEnabled(false);
              else {
                setEnabled(true);
                setEntryMode(id);
              }
            }}
          >
            <span className="font-semibold">{t(label)}</span>
            <span className={`mt-1 block text-xs ${mode === id ? "text-white/80" : "text-zinc-500"}`}>
              {t(`${label}Hint`)}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-2 rounded-xl bg-zinc-50 p-3 text-xs">
        <p>
          <span className="font-semibold">{t("menuStudio.linkHub")}: </span>
          {publicMerchantUrl(slug)}
        </p>
        <p>
          <span className="font-semibold">{t("menuStudio.linkPlay")}: </span>
          {publicMerchantPlayUrl(slug)}
        </p>
        <p>
          <span className="font-semibold">{t("menuStudio.linkMenu")}: </span>
          {publicMerchantMenuUrl(slug)}
        </p>
      </div>
    </div>
  );
}

