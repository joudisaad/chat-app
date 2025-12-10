import React, { useState, useEffect } from 'react';
import type { Inbox } from '../../lib/api';

interface InboxSidebarProps {
  inboxes: Inbox[];
  activeInboxId: string | null;
  onSelectInbox: (id: string | null) => void;
  onCreateInbox: (name: string) => void;
}

export const InboxSidebar: React.FC<InboxSidebarProps> = ({
  inboxes,
  activeInboxId,
  onSelectInbox,
  onCreateInbox,
}) => {
  const [isCreatingInbox, setIsCreatingInbox] = useState(false);
  const [newInboxName, setNewInboxName] = useState('');

  useEffect(() => {
    if (!isCreatingInbox) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCreatingInbox(false);
        setNewInboxName('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreatingInbox]);

  const handleAdd = () => {
    setIsCreatingInbox(true);
    setNewInboxName('');
  };

  const handleCreateSubmit = () => {
    const trimmed = newInboxName.trim();
    if (!trimmed) return;
    onCreateInbox(trimmed);
    setIsCreatingInbox(false);
    setNewInboxName('');
  };

  const allActive = activeInboxId === null;

  return (
    <div className="flex h-full w-56 flex-col border-r border-slate-200 bg-slate-50/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Inbox
        </span>
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400 bg-emerald-50 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-emerald-950 dark:border-emerald-500 dark:bg-slate-900/80 dark:text-emerald-400 dark:hover:bg-emerald-500/90 dark:hover:text-slate-950"
          onClick={handleAdd}
        >
          +
        </button>
      </div>

      <div className="mt-1 flex-1 overflow-y-auto px-2 pb-3">
        <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Default inboxes
        </div>

        <button
          type="button"
          className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${
            allActive
              ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          }`}
          onClick={() => onSelectInbox(null)}
        >
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="truncate text-xs font-medium">All</span>
        </button>

        {inboxes.map((inbox) => {
          const isActive = inbox.id === activeInboxId;
          return (
            <button
              key={inbox.id}
              type="button"
              className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
              onClick={() => onSelectInbox(inbox.id)}
            >
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
              <span className="truncate text-xs font-medium">{inbox.name}</span>
            </button>
          );
        })}
      </div>
      {isCreatingInbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => {
            setIsCreatingInbox(false);
            setNewInboxName('');
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              New sub-inbox
            </h3>
            <p className="mb-3 text-[12px] text-slate-500 dark:text-slate-400">
              Create a sub-inbox to organize your conversations (e.g. Billing, Sales, Support).
            </p>
            <div className="mb-3">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Name
              </label>
              <input
                type="text"
                value={newInboxName}
                onChange={(e) => setNewInboxName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateSubmit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsCreatingInbox(false);
                    setNewInboxName('');
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="e.g. Billing, Sales, Support..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingInbox(false);
                  setNewInboxName('');
                }}
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                disabled={!newInboxName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};