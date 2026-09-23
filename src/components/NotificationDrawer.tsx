import React from 'react';
import { X, MessageSquare, Bell, CheckCircle2, AlertTriangle, CreditCard, Sparkles } from 'lucide-react';
import { NotificationItem, Language } from '../types';
import { t } from '../i18n';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  language: Language;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  language
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-gray-200">
        
        {/* Drawer Header */}
        <div className="bg-[#1B5E3C] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base">{t(language, 'notifications')}</h3>
              <p className="text-[11px] text-emerald-200">Simulated Indian SMS Gateway &amp; App Alerts</p>
            </div>
          </div>
          <button
            id="close-notif-drawer-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-800 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">
            {notifications.length} updates logged
          </span>
          <button
            id="mark-all-read-btn"
            onClick={onMarkAllRead}
            className="text-[#1B5E3C] hover:text-emerald-900 font-bold hover:underline"
          >
            {t(language, 'markAllRead')}
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {t(language, 'noNotifications')}
            </div>
          ) : (
            notifications.map((notif) => {
              const isSms = notif.channel === 'sms';
              const isPayment = notif.type === 'payment';
              const isQueue = notif.type === 'queue_alert';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    !notif.read
                      ? 'bg-amber-50/50 border-amber-200/80 shadow-xs'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isPayment ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                      ) : isQueue ? (
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <span className="text-xs font-bold text-gray-900">
                        {language === 'hi' ? notif.titleHi || notif.title : notif.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isSms && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-200/80 text-gray-700">
                          SMS
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-medium">
                        {notif.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* SMS Phone Bubble simulation */}
                  <div className={`text-xs leading-relaxed p-2.5 rounded-lg ${
                    isSms 
                      ? 'bg-emerald-50/70 border border-emerald-200/60 font-mono text-emerald-950' 
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {language === 'hi' ? notif.messageHi || notif.message : notif.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-gray-100 text-[11px] text-gray-500 text-center border-t border-gray-200">
          Farmers receive automatic SMS pushes when their token is within 3 positions of the weighing gate.
        </div>

      </div>
    </div>
  );
};
