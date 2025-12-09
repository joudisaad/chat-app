import React from 'react';
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
  const handleAdd = () => {
    const name = window.prompt('Sub-inbox name?');
    if (!name) return;
    onCreateInbox(name.trim());
  };

  const allActive = activeInboxId === null;

  return (
    <div className="inbox-sidebar">
      <div className="inbox-sidebar-header">
        <span className="inbox-sidebar-title">Inbox</span>
        <button
          type="button"
          className="inbox-sidebar-add"
          onClick={handleAdd}
        >
          +
        </button>
      </div>

      <div className="inbox-sidebar-list">
        <div className="inbox-sidebar-section-label">DEFAULT INBOXES</div>
        <button
          type="button"
          className={
            'inbox-sidebar-item' + (allActive ? ' inbox-sidebar-item-active' : '')
          }
          onClick={() => onSelectInbox(null)}
        >
          <span className="inbox-sidebar-item-dot" />
          <span className="inbox-sidebar-item-label">ALL</span>
        </button>
        {inboxes.map((inbox) => {
          const isActive = inbox.id === activeInboxId;
          return (
            <button
              key={inbox.id}
              type="button"
              className={
                'inbox-sidebar-item' + (isActive ? ' inbox-sidebar-item-active' : '')
              }
              onClick={() => onSelectInbox(inbox.id)}
            >
              <span className="inbox-sidebar-item-dot" />
              <span className="inbox-sidebar-item-label">{inbox.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};