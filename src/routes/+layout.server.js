export function load({ locals }) {
  return {
    user: locals.user,
    settings: locals.settings
  };
}
