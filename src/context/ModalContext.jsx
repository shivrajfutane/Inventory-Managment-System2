import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const closeModal = useCallback(() => {
        if (modalConfig?.onCancel) {
            modalConfig.onCancel();
        }
        setModalConfig(null);
    }, [modalConfig]);

    const showModal = useCallback((config) => {
        setModalConfig(config);
    }, []);

    const showConfirm = useCallback((message, title = 'Are you sure?', onConfirm = null, onCancel = null, confirmText = 'Delete', confirmClass = 'btn-danger') => {
        setModalConfig({
            title,
            content: <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{message}</p>,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setModalConfig(null);
            },
            onCancel,
            confirmText,
            cancelText: 'Cancel',
            confirmClass,
            size: 'sm'
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, showConfirm, closeModal }}>
            {children}
            {modalConfig && (
                <div 
                    className="modal-overlay backdrop-enter"
                    onClick={(e) => {
                        if (e.target.classList.contains('modal-overlay')) closeModal();
                    }}
                >
                    <div 
                        className="modal-container modal-enter" 
                        style={{ maxWidth: modalConfig.size === 'sm' ? '380px' : modalConfig.size === 'lg' ? '720px' : '520px' }}
                    >
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {modalConfig.title}
                                </h3>
                            </div>
                            <button 
                                onClick={closeModal} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {modalConfig.content}
                        </div>
                        <div className="modal-footer">
                            <button onClick={closeModal} className="btn btn-secondary">
                                {modalConfig.cancelText || 'Cancel'}
                            </button>
                            {modalConfig.onConfirm && (
                                <button onClick={modalConfig.onConfirm} className={`btn ${modalConfig.confirmClass || 'btn-primary'}`}>
                                    {modalConfig.confirmText || 'Confirm'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
