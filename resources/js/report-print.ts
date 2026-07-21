document
    .querySelector<HTMLButtonElement>('[data-print-report]')
    ?.addEventListener('click', () => window.print());
