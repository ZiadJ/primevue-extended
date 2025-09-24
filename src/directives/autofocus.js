export default {
  mounted(el) {
    const elFocus =
      el.querySelector("input:not([type='hidden']), select, textarea, ul, ol") || el;

    setTimeout(() => elFocus.focus());
  },
}