export function createRippleEffect(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');
  
  // Ensure the button has relative positioning
  if (getComputedStyle(button).position === 'static') {
    button.style.position = 'relative';
  }
  
  button.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

export function addRippleToButtons() {
  const buttons = document.querySelectorAll('button, [role="button"]');
  
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      createRippleEffect(e as any);
    });
  });
}