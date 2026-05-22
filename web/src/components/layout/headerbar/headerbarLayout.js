export function getHeaderContainerClass(isWorkspaceRoute = false) {
  const widthClass = isWorkspaceRoute ? 'max-w-none' : 'max-w-7xl';
  const workspaceClass = isWorkspaceRoute
    ? 'headerbar-container-workspace'
    : '';

  return `headerbar-container ${workspaceClass} mx-auto flex items-center justify-between gap-6 px-4 md:px-6 ${widthClass}`;
}
