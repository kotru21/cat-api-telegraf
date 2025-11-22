// Simple confirmation modal helper
export function initConfirmationModal({
  modalSelector = '#confirmation-modal',
  breedNameSelector = '#modal-breed-name',
  cancelSelector = '#modal-cancel',
  confirmSelector = '#modal-confirm',
} = {}) {
  const modal = document.querySelector(modalSelector) as HTMLElement;
  const breedNameEl = document.querySelector(breedNameSelector);
  const cancelBtn = document.querySelector(cancelSelector);
  const confirmBtn = document.querySelector(confirmSelector);
  if (!modal || !breedNameEl || !cancelBtn || !confirmBtn) return { show: () => {} };

  function show(breedName: string, onConfirm: () => void) {
    breedNameEl!.textContent = breedName;
    modal.style.display = 'flex';

    const handleCancel = () => cleanup();
    const handleConfirm = () => {
      if (onConfirm) onConfirm();
      cleanup();
    };

    function cleanup() {
      modal.style.display = 'none';
      cancelBtn!.removeEventListener('click', handleCancel);
      confirmBtn!.removeEventListener('click', handleConfirm);
    }

    cancelBtn!.addEventListener('click', handleCancel);
    confirmBtn!.addEventListener('click', handleConfirm);
  }

  return { show };
}

export default initConfirmationModal;
